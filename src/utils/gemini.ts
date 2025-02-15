import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/config/env.config";

declare global {
  // eslint-disable-next-line no-var
  var gemini: GoogleGenerativeAI | undefined;
}

const gemini =
  global.gemini || new GoogleGenerativeAI(env.server.GEMINI_API_KEY);

if (env.client.NODE_ENV !== "production") global.gemini = gemini;

export default gemini;
