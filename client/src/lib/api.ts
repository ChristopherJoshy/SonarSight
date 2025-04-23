// API functions for communicating with the backend

export async function apiRequest(
  endpoint: string,
  data: any
): Promise<any> {
  try {
    // Use relative URL for API endpoints to avoid CORS issues
    // This ensures it works regardless of where the app is hosted
    const baseUrl = '/api';
    const response = await fetch(`${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}
