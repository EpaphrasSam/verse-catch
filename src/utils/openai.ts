import OpenAI from "openai";
import { env } from "@/config/env.config";

declare global {
  // eslint-disable-next-line no-var
  var openai: OpenAI | undefined;
}

const openai =
  global.openai ||
  new OpenAI({
    apiKey: env.server.OPENAI_API_KEY,
  });

if (env.client.NODE_ENV !== "production") global.openai = openai;

export default openai;
