export type Platform = "linkedin" | "instagram";

export interface HistoryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  linkedin: number;
  instagram: number;
  notes?: string;
  engagement?: {
    linkedin?: { likes: number; comments: number; shares: number };
    instagram?: { likes: number; comments: number; shares: number };
  };
}

export interface PostLogEntry {
  linkedin: boolean;
  instagram: boolean;
}

export type PostLog = Record<string, PostLogEntry>;

export interface PillarPost {
  id: string;
  platform: Platform;
  pillar: string;
  date: string; // YYYY-MM-DD
  headline: string;
  engagement?: { likes: number; comments: number; shares: number };
}

export interface ChecklistDay {
  date: string;
  completed: string[]; // ids of checked items
}

export interface Milestone {
  week: number;
  linkedin: number;
  instagram: number;
}

export interface Settings {
  engineMode: "ai" | "rule-based";
}

export interface AICache {
  generatedAt: string | null; // ISO timestamp
  ideas: Record<Platform, { pillar: string; headline: string }[]> | null;
}

export interface GrowthConsoleData {
  sprintStart: string;
  history: HistoryEntry[];
  postLog: PostLog;
  pillarPosts: PillarPost[];
  checklist: ChecklistDay[];
  settings: Settings;
  aiCache: AICache;
}

export const MILESTONES: Milestone[] = [
  { week: 0, linkedin: 7000, instagram: 10 },
  { week: 4, linkedin: 11500, instagram: 500 },
  { week: 8, linkedin: 17500, instagram: 2000 },
  { week: 12, linkedin: 25000, instagram: 5000 },
];

export const TARGETS = { linkedin: 25000, instagram: 5000 };
export const STARTING = { linkedin: 7000, instagram: 10 };
export const SPRINT_WEEKS = 12;
