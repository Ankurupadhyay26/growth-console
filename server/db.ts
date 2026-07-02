import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { GrowthConsoleData } from "../src/data/types.ts";
import { todayISO } from "../src/lib/sprint.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFile = path.join(__dirname, "..", "data.json");

const defaultData: GrowthConsoleData = {
  sprintStart: todayISO(),
  history: [
    {
      id: crypto.randomUUID(),
      date: todayISO(),
      linkedin: 7000,
      instagram: 10,
      notes: "Sprint start",
    },
  ],
  postLog: {},
  pillarPosts: [],
  checklist: [],
  settings: {
    engineMode: process.env.ANTHROPIC_API_KEY ? "ai" : "rule-based",
  },
  aiCache: {
    generatedAt: null,
    ideas: null,
  },
};

const adapter = new JSONFile<GrowthConsoleData>(dataFile);
export const db = new Low<GrowthConsoleData>(adapter, defaultData);

export async function initDb() {
  const fileExisted = existsSync(dataFile);
  await db.read();

  // Backfill any fields missing from an older data.json (or write the file for the first time)
  let dirty = false;
  const d = db.data as any;
  if (!d.sprintStart) { d.sprintStart = defaultData.sprintStart; dirty = true; }
  if (!d.history) { d.history = defaultData.history; dirty = true; }
  if (!d.postLog) { d.postLog = {}; dirty = true; }
  if (!d.pillarPosts) { d.pillarPosts = []; dirty = true; }
  if (!d.checklist) { d.checklist = []; dirty = true; }
  if (!d.settings) { d.settings = defaultData.settings; dirty = true; }
  if (!d.aiCache) { d.aiCache = defaultData.aiCache; dirty = true; }
  if (!fileExisted || dirty) await db.write();
  return db;
}
