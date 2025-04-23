import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define the queries table
export const queries = pgTable("queries", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  context: text("context"),
  response: text("response").notNull(),
  citations: jsonb("citations"),
  created_at: timestamp("created_at").defaultNow().notNull()
});

// Define the saved items table
export const savedItems = pgTable("saved_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  source_text: text("source_text"),
  citations_count: integer("citations_count").default(0),
  created_at: timestamp("created_at").defaultNow().notNull()
});

// Create insert schemas
export const insertQuerySchema = createInsertSchema(queries).pick({
  query: true,
  context: true,
  response: true,
  citations: true
});

export const insertSavedItemSchema = createInsertSchema(savedItems).pick({
  title: true,
  content: true,
  source_text: true,
  citations_count: true
});

// Define types
export type InsertQuery = z.infer<typeof insertQuerySchema>;
export type Query = typeof queries.$inferSelect;

export type InsertSavedItem = z.infer<typeof insertSavedItemSchema>;
export type SavedItem = typeof savedItems.$inferSelect;
