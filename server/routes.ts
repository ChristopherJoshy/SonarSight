import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import fetch from "node-fetch";

// Load environment variables
dotenv.config();

// API provider constants
const PROVIDER_GEMINI = 'gemini';
const PROVIDER_PERPLEXITY = 'perplexity';

// Initialize the services only when needed with keys from request
interface AIServiceRequest extends Request {
  body: {
    query: string;
    context?: string;
    provider?: string;
    apiKey?: string;
    temperature?: number; 
    maxTokens?: number;
    model?: string;
    enhancedResults?: boolean;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Enable CORS
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Server status endpoint to check if it's running
  app.get("/api/status", (req, res) => {
    res.json({ 
      status: "online",
      timestamp: new Date().toISOString(),
      providers: ["gemini", "perplexity"]
    });
  });

  // Query endpoint
  app.post("/api/query", async (req: AIServiceRequest, res) => {
    try {
      const { 
        query, 
        context, 
        provider = PROVIDER_GEMINI, 
        apiKey,
        temperature,
        maxTokens,
        model,
        enhancedResults = false
      } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      // Only use client-provided API keys - no environment fallbacks
      let apiKeyToUse = apiKey || "";
      
      // Check if API key is available and valid (non-empty)
      if (!apiKeyToUse || apiKeyToUse.trim() === "") {
        return res.status(401).json({ 
          error: "API key is required", 
          details: `Please provide an API key for ${provider} in the extension settings.`,
          needsApiKey: true,
          provider: provider
        });
      }
      
      // For debugging (not logging full key for security)
      console.log(`Using ${provider} with user-provided API key (starting with: ${apiKeyToUse.substring(0, 4)}...)`);
      

      const fullPrompt = context 
        ? `Given the following context:\n\n${context}\n\nQuestion: ${query}`
        : query;

      // Process based on selected provider
      if (provider === PROVIDER_GEMINI) {
        return await handleGeminiRequest(
          fullPrompt, 
          apiKeyToUse, 
          res, 
          {
            temperature,
            maxTokens,
            model,
            enhancedResults
          }
        );
      } else if (provider === PROVIDER_PERPLEXITY) {
        return await handlePerplexityRequest(
          fullPrompt, 
          apiKeyToUse, 
          res, 
          {
            temperature,
            maxTokens,
            model,
            enhancedResults
          }
        );
      } else {
        return res.status(400).json({ error: "Invalid provider specified" });
      }
    } catch (error) {
      console.error("Error processing query:", error);
      res.status(500).json({ error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Handler for Google Gemini
async function handleGeminiRequest(
  prompt: string, 
  apiKey: string, 
  res: any,
  options: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
    enhancedResults?: boolean;
  } = {}
) {
  try {
    // Initialize the Google Generative AI with the provided key
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Configure the model with defaults or provided options
    const modelName = options.model || "gemini-1.5-pro";
    
    const model = genAI.getGenerativeModel({
      model: modelName,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    const generationConfig = {
      temperature: options.temperature !== undefined ? options.temperature : 0.4,
      topK: 32,
      topP: 0.95,
      maxOutputTokens: options.maxTokens !== undefined ? options.maxTokens : 1024,
    };

    // Enhanced system prompt for better results
    let systemPrompt = "You are a helpful research assistant. Provide concise and accurate information. When analyzing or summarizing content, include numbered citations for claims when possible. Format your response in a clean, readable manner using markdown. Be objective and analytical.";
    
    // If enhanced results is enabled, use a more detailed system prompt
    if (options.enhancedResults) {
      systemPrompt = "You are SonarSight, an expert research assistant with deep analytical capabilities. When analyzing text: 1) Begin with a concise summary of the core message, 2) Identify key themes using markdown headings, 3) Provide well-structured analysis with proper formatting, 4) Include numbered citations for claims, 5) Use proper paragraph breaks and formatting for readability, 6) Remain objective in your analysis, 7) Add contextual information when helpful, 8) Highlight any contradictions or logical issues, 9) Conclude with important takeaways. Format your response using proper markdown syntax to enhance readability.";
    }

    // Call Gemini API
    const result = await model.generateContent({
      contents: [
        {
          role: "user", 
          parts: [
            { 
              text: systemPrompt
            }
          ]
        },
        {
          role: "model",
          parts: [{ text: "I understand. I'll act as a research assistant providing concise, accurate information with numbered citations when possible. My analysis will be objective and formatted for readability." }]
        },
        { 
          role: "user", 
          parts: [{ text: prompt }]
        }
      ],
      generationConfig,
    });

    const response = result.response;
    const responseText = response.text();

    // Extract citations from the response text
    const citationRegex = /\[(\d+)\]\s*(?:https?:\/\/[^\s]+)/g;
    const citations: string[] = [];
    
    let match: RegExpExecArray | null;
    while ((match = citationRegex.exec(responseText)) !== null) {
      if (match[0]) {
        const parts = match[0].split(/\s+/);
        const url = parts.find((p: string) => p.startsWith('http'));
        if (url && !citations.includes(url)) {
          citations.push(url);
        }
      }
    }
    
    // Return formatted response
    return res.json({
      provider: PROVIDER_GEMINI,
      content: responseText,
      citations: citations
    });
  } catch (error) {
    console.error("Error with Gemini API:", error);
    // Add more detailed error logging
    if (error instanceof Error) {
      console.error(`Gemini API error details: ${error.message}`);
      console.error(`Gemini API error stack: ${error.stack}`);
    }
    return res.status(500).json({ 
      error: "Error with Gemini API", 
      details: error instanceof Error ? error.message : "Unknown error",
      provider: PROVIDER_GEMINI 
    });
  }
}

// Handler for Perplexity
async function handlePerplexityRequest(
  prompt: string, 
  apiKey: string, 
  res: any,
  options: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
    enhancedResults?: boolean;
  } = {}
) {
  try {
    // Select the appropriate model based on options
    const modelName = options.model || 'llama-3.1-sonar-small-128k-online';
    
    // Enhanced system prompt for better results
    let systemPrompt = 'You are a helpful research assistant. Provide concise and accurate information. When analyzing or summarizing content, include numbered citations for claims when possible. Format your response in a clean, readable manner using markdown. Be objective and analytical.';
    
    // If enhanced results is enabled, use a more detailed system prompt
    if (options.enhancedResults) {
      systemPrompt = "You are SonarSight, an expert research assistant with deep analytical capabilities. When analyzing text: 1) Begin with a concise summary of the core message, 2) Identify key themes using markdown headings, 3) Provide well-structured analysis with proper formatting, 4) Include numbered citations for claims, 5) Use proper paragraph breaks and formatting for readability, 6) Remain objective in your analysis, 7) Add contextual information when helpful, 8) Highlight any contradictions or logical issues, 9) Conclude with important takeaways. Format your response using proper markdown syntax to enhance readability.";
    }
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: options.temperature !== undefined ? options.temperature : 0.2,
        top_p: 0.9,
        search_recency_filter: 'month',
        max_tokens: options.maxTokens !== undefined ? options.maxTokens : 1024
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Perplexity API error: ${response.status} - ${errorText}`);
      throw new Error(`Perplexity API responded with status: ${response.status}. Details: ${errorText}`);
    }

    const data = await response.json() as {
      choices: Array<{
        message: {
          content: string;
        };
      }>;
      citations?: string[];
    };
    
    const responseText = data.choices[0].message.content;
    const citations = data.citations || [];

    return res.json({
      provider: PROVIDER_PERPLEXITY,
      content: responseText,
      citations: citations
    });
  } catch (error) {
    console.error("Error with Perplexity API:", error);
    
    // Add more detailed error logging
    if (error instanceof Error) {
      console.error(`Perplexity API error details: ${error.message}`);
      console.error(`Perplexity API error stack: ${error.stack}`);
    }
    
    // Check for specific error types
    let errorMessage = "Error with Perplexity API";
    let errorDetails = error instanceof Error ? error.message : "Unknown error";
    
    // If it's an authentication error, provide more helpful instructions
    if (errorDetails.includes("401") || errorDetails.toLowerCase().includes("unauthorized")) {
      errorMessage = "API key authentication failed";
      errorDetails = "The Perplexity API key appears to be invalid or expired. Please check your API key and try again.";
    }
    
    return res.status(500).json({ 
      error: errorMessage, 
      details: errorDetails,
      provider: PROVIDER_PERPLEXITY
    });
  }
}
