import { z } from "zod";

// Define environment variables with explicit process.env access
const ENV = {
  // API Keys
  OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY || "",
  GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "",

  // Pusher Configuration
  PUSHER_APP_ID: process.env.NEXT_PUBLIC_PUSHER_APP_ID || "",
  NEXT_PUBLIC_PUSHER_KEY: process.env.NEXT_PUBLIC_PUSHER_KEY || "",
  PUSHER_SECRET: process.env.NEXT_PUBLIC_PUSHER_SECRET || "",
  NEXT_PUBLIC_PUSHER_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "",

  // App URLs
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "",

  // Environment
  NODE_ENV: process.env.NEXT_PUBLIC_NODE_ENV || "development",
} as const;

// Validate environment variables
const envSchema = z.object({
  // API Keys
  OPENAI_API_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),

  // Pusher Configuration
  PUSHER_APP_ID: z.string().min(1),
  NEXT_PUBLIC_PUSHER_KEY: z.string().min(1),
  PUSHER_SECRET: z.string().min(1),
  NEXT_PUBLIC_PUSHER_CLUSTER: z.string().min(1),

  // App URLs
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // Environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

// Export type
export type Env = z.infer<typeof envSchema>;

// Validate and export env
function validateEnv(): Env {
  try {
    return envSchema.parse(ENV);
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
