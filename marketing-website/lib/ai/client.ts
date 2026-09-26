/**
 * OpenAI client.
 *
 * One shared client. If OPENAI_API_KEY is absent the app degrades to the
 * deterministic fallback in summary.ts rather than erroring, so the deal
 * summary flow stays demoable before a key is wired up.
 */

import OpenAI from "openai";

export const MODEL = "gpt-4o-mini";

const globalForAi = globalThis as unknown as { __mandateOpenAi?: OpenAI };

export function aiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function openai(): OpenAI {
  if (!globalForAi.__mandateOpenAi) {
    globalForAi.__mandateOpenAi = new OpenAI();
  }
  return globalForAi.__mandateOpenAi;
}
