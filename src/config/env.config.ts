import { z } from "zod";

// Server-side environment variables
const SERVER_ENV = {
  // API Keys
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",

  // Pusher Configuration (Server)
  PUSHER_APP_ID: process.env.PUSHER_APP_ID || "",
  PUSHER_SECRET: process.env.PUSHER_SECRET || "",

  // Environment
  NODE_ENV: process.env.NODE_ENV || "development",
} as const;

// Client-side environment variables
const CLIENT_ENV = {
  // Pusher Configuration (Client)
  PUSHER_KEY: process.env.NEXT_PUBLIC_PUSHER_KEY || "",
  PUSHER_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "",

  // Environment
  NODE_ENV: process.env.NEXT_PUBLIC_NODE_ENV || "development",
} as const;

// Validate environment variables
const serverEnvSchema = z.object({
  // API Keys
  OPENAI_API_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),

  // Pusher Configuration (Server)
  PUSHER_APP_ID: z.string().min(1),
  PUSHER_SECRET: z.string().min(1),

  // Environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

const clientEnvSchema = z.object({
  // Pusher Configuration (Client)
  PUSHER_KEY: z.string().min(1),
  PUSHER_CLUSTER: z.string().min(1),

  // Environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

// Export types
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

// Validate and export env
function validateEnv() {
  const isServer = typeof window === "undefined";

  try {
    // Always validate client env
    const client = clientEnvSchema.parse(CLIENT_ENV);

    // Only validate server env on the server
    const server = isServer
      ? serverEnvSchema.parse(SERVER_ENV)
      : ({} as ServerEnv);

    return { server, client };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map((err) => err.path.join("."))
        .join(", ");
      throw new Error(
        `Missing or invalid environment variables: ${missingVars}`
      );
    }
    throw new Error("Failed to validate environment variables");
  }
}

export const env = validateEnv();
