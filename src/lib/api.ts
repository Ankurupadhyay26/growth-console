import type { HistoryEntry, PillarPost, PostLog } from "../data/types";
import type { RankedIdea, PillarStat } from "./ruleEngine";

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface SprintInfo {
  sprintStart: string;
  today: string;
  day: number;
  daysRemaining: number;
  week: number;
}

export const api = {
  getSprint: () => req<SprintInfo>("/sprint"),
  getHistory: () => req<HistoryEntry[]>("/history"),
  addHistory: (entry: Omit<HistoryEntry, "id">) =>
    req<HistoryEntry>("/history", { method: "POST", body: JSON.stringify(entry) }),
  updateHistory: (id: string, entry: Partial<HistoryEntry>) =>
    req<HistoryEntry>(`/history/${id}`, { method: "PUT", body: JSON.stringify(entry) }),
  deleteHistory: (id: string) => req<void>(`/history/${id}`, { method: "DELETE" }),

  getPostLog: () => req<PostLog>("/postlog"),
  setPostLog: (date: string, platform: "linkedin" | "instagram", posted: boolean) =>
    req<PostLog>("/postlog", { method: "POST", body: JSON.stringify({ date, platform, posted }) }),

  getPillarPosts: () => req<PillarPost[]>("/pillarposts"),
  addPillarPost: (post: Omit<PillarPost, "id">) =>
    req<PillarPost>("/pillarposts", { method: "POST", body: JSON.stringify(post) }),

  getChecklist: (date: string) => req<{ date: string; completed: string[] }>(`/checklist/${date}`),
  getChecklistHistory: () => req<{ date: string; completed: string[] }[]>("/checklist-history"),
  setChecklistItem: (date: string, itemId: string, checked: boolean) =>
    req<{ date: string; completed: string[] }>("/checklist", {
      method: "POST",
      body: JSON.stringify({ date, itemId, checked }),
    }),

  getSettings: () => req<{ engineMode: "ai" | "rule-based"; aiAvailable: boolean }>("/settings"),
  setSettings: (engineMode: "ai" | "rule-based") =>
    req<{ engineMode: string }>("/settings", { method: "PUT", body: JSON.stringify({ engineMode }) }),

  getContentFeed: (refresh?: boolean) =>
    req<ContentFeedResponse>(`/content-feed${refresh ? "?refresh=1" : ""}`),
};

export interface ContentFeedResponse {
  today: string;
  week: number;
  engineMode: "ai" | "rule-based";
  engineUsed: "ai" | "rule-based";
  aiAvailable: boolean;
  aiError: string | null;
  aiCacheGeneratedAt: string | null;
  ruleBased: {
    linkedin: { ideas: RankedIdea[]; stats: PillarStat[]; pace: string };
    instagram: { ideas: RankedIdea[]; stats: PillarStat[]; pace: string };
  };
  aiIdeas: Record<"linkedin" | "instagram", { pillar: string; headline: string }[]> | null;
}
