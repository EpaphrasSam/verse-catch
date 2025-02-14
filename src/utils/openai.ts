import OpenAI from "openai";
import { env } from "@/config/env.config";

declare global {
  // eslint-disable-next-line no-var
  var openai: OpenAI | undefined;
}

const openai =
  global.openai ||
  new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

if (env.NODE_ENV !== "production") global.openai = openai;

export default openai;
