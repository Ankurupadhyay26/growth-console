import Anthropic from "@anthropic-ai/sdk";
import type { AICache, Platform } from "../src/data/types.ts";
import type { PillarStat } from "../src/lib/ruleEngine.ts";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

export interface AIEngineInput {
  today: string;
  weekOfSprint: number;
  followerDeltas: { linkedin: number; instagram: number }; // change over trailing 7 days
  pace: { linkedin: string; instagram: string };
  pillarStats: { linkedin: PillarStat[]; instagram: PillarStat[] };
  postedThisWeek: { linkedin: string[]; instagram: string[] }; // headlines already posted
}

export function aiEngineAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function cacheIsFresh(cache: AICache): boolean {
  if (!cache.generatedAt || !cache.ideas) return false;
  const ageMs = Date.now() - new Date(cache.generatedAt).getTime();
  return ageMs < 24 * 60 * 60 * 1000;
}

export async function generateAIIdeas(
  input: AIEngineInput,
): Promise<Record<Platform, { pillar: string; headline: string }[]>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const client = new Anthropic({ apiKey });

  const prompt = `You are a content strategist helping a Technical Product Manager grow LinkedIn (AI/Data/PM niche) and Instagram (same niche) over a 12-week sprint.

Here is this week's data as JSON:
${JSON.stringify(input, null, 2)}

Write 2-3 fresh, non-generic content ideas per platform that react to this specific data (pace, pillar performance, what's already been posted this week so nothing repeats). Do not just re-sort a generic list -- make each idea specific enough that it reads like it was written for this exact week.

Respond with ONLY valid JSON, no markdown fences, no commentary, in this exact shape:
{
  "linkedin": [{"pillar": "string", "headline": "string"}],
  "instagram": [{"pillar": "string", "headline": "string"}]
}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("No text response from AI engine");

  const cleaned = textBlock.text.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const parsed = JSON.parse(cleaned);
  return parsed;
}
