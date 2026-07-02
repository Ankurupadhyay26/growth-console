import "dotenv/config";
import express from "express";
import cors from "cors";
import { initDb, db } from "./db.ts";
import { todayISO, dayOfSprint, weekOfSprint } from "../src/lib/sprint.ts";
import { rankIdeas } from "../src/lib/ruleEngine.ts";
import { aiEngineAvailable, cacheIsFresh, generateAIIdeas } from "./aiEngine.ts";
import type { HistoryEntry, PillarPost } from "../src/data/types.ts";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4001;

app.use(cors());
app.use(express.json());

await initDb();

// ---------- Sprint ----------
app.get("/api/sprint", (_req, res) => {
  const sprintStart = db.data.sprintStart;
  const today = todayISO();
  const day = dayOfSprint(sprintStart, today);
  const totalDays = 90;
  res.json({
    sprintStart,
    today,
    day: Math.min(day, totalDays),
    daysRemaining: Math.max(0, totalDays - day),
    week: weekOfSprint(sprintStart, today),
  });
});

// ---------- History ----------
app.get("/api/history", (_req, res) => {
  res.json(db.data.history);
});

app.post("/api/history", async (req, res) => {
  const body = req.body as Partial<HistoryEntry>;
  if (!body.date || typeof body.linkedin !== "number" || typeof body.instagram !== "number") {
    return res.status(400).json({ error: "date, linkedin, instagram are required" });
  }
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    date: body.date,
    linkedin: body.linkedin,
    instagram: body.instagram,
    notes: body.notes ?? "",
    engagement: body.engagement,
  };
  db.data.history.push(entry);
  db.data.history.sort((a, b) => (a.date < b.date ? -1 : 1));
  await db.write();
  res.status(201).json(entry);
});

app.put("/api/history/:id", async (req, res) => {
  const idx = db.data.history.findIndex((h) => h.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "not found" });
  db.data.history[idx] = { ...db.data.history[idx], ...req.body, id: req.params.id };
  db.data.history.sort((a, b) => (a.date < b.date ? -1 : 1));
  await db.write();
  res.json(db.data.history[idx]);
});

app.delete("/api/history/:id", async (req, res) => {
  const before = db.data.history.length;
  db.data.history = db.data.history.filter((h) => h.id !== req.params.id);
  if (db.data.history.length === before) return res.status(404).json({ error: "not found" });
  await db.write();
  res.status(204).end();
});

// ---------- Post log (heatmap) ----------
app.get("/api/postlog", (_req, res) => {
  res.json(db.data.postLog);
});

app.post("/api/postlog", async (req, res) => {
  const { date, platform, posted } = req.body as { date: string; platform: "linkedin" | "instagram"; posted: boolean };
  if (!date || !platform) return res.status(400).json({ error: "date and platform required" });
  const entry = db.data.postLog[date] ?? { linkedin: false, instagram: false };
  entry[platform] = posted;
  db.data.postLog[date] = entry;
  await db.write();
  res.json(db.data.postLog);
});

// ---------- Pillar posts (content feed logging) ----------
app.get("/api/pillarposts", (_req, res) => {
  res.json(db.data.pillarPosts);
});

app.post("/api/pillarposts", async (req, res) => {
  const body = req.body as Partial<PillarPost>;
  if (!body.platform || !body.pillar || !body.date || !body.headline) {
    return res.status(400).json({ error: "platform, pillar, date, headline required" });
  }
  const post: PillarPost = {
    id: crypto.randomUUID(),
    platform: body.platform,
    pillar: body.pillar,
    date: body.date,
    headline: body.headline,
    engagement: body.engagement,
  };
  db.data.pillarPosts.push(post);

  const logEntry = db.data.postLog[body.date] ?? { linkedin: false, instagram: false };
  logEntry[body.platform] = true;
  db.data.postLog[body.date] = logEntry;

  await db.write();
  res.status(201).json(post);
});

// ---------- Daily checklist ----------
app.get("/api/checklist/:date", (req, res) => {
  const entry = db.data.checklist.find((c) => c.date === req.params.date);
  res.json(entry ?? { date: req.params.date, completed: [] });
});

app.post("/api/checklist", async (req, res) => {
  const { date, itemId, checked } = req.body as { date: string; itemId: string; checked: boolean };
  if (!date || !itemId) return res.status(400).json({ error: "date and itemId required" });
  let entry = db.data.checklist.find((c) => c.date === date);
  if (!entry) {
    entry = { date, completed: [] };
    db.data.checklist.push(entry);
  }
  if (checked && !entry.completed.includes(itemId)) entry.completed.push(itemId);
  if (!checked) entry.completed = entry.completed.filter((id) => id !== itemId);
  await db.write();
  res.json(entry);
});

app.get("/api/checklist-history", (_req, res) => {
  res.json(db.data.checklist);
});

// ---------- Settings ----------
app.get("/api/settings", (_req, res) => {
  res.json({ ...db.data.settings, aiAvailable: aiEngineAvailable() });
});

app.put("/api/settings", async (req, res) => {
  const { engineMode } = req.body as { engineMode: "ai" | "rule-based" };
  if (engineMode === "ai" && !aiEngineAvailable()) {
    return res.status(400).json({ error: "ANTHROPIC_API_KEY not set, cannot enable AI engine" });
  }
  db.data.settings.engineMode = engineMode;
  await db.write();
  res.json(db.data.settings);
});

// ---------- Content feed ----------
app.get("/api/content-feed", async (req, res) => {
  const today = todayISO();
  const sprintStart = db.data.sprintStart;
  const week = weekOfSprint(sprintStart, today);
  const latest = db.data.history[db.data.history.length - 1];
  const currentFollowers = { linkedin: latest?.linkedin ?? 7000, instagram: latest?.instagram ?? 10 };

  const linkedinRanked = rankIdeas("linkedin", db.data.pillarPosts, currentFollowers.linkedin, week, today);
  const instagramRanked = rankIdeas("instagram", db.data.pillarPosts, currentFollowers.instagram, week, today);

  const aiAvailable = aiEngineAvailable();
  const wantsAI = db.data.settings.engineMode === "ai";
  let engineUsed: "ai" | "rule-based" = "rule-based";
  let aiIdeas = null;
  let aiError: string | null = null;

  if (wantsAI && aiAvailable) {
    const forceRefresh = req.query.refresh === "1";
    if (!forceRefresh && cacheIsFresh(db.data.aiCache)) {
      aiIdeas = db.data.aiCache.ideas;
      engineUsed = "ai";
    } else {
      try {
        const sevenDaysAgo = db.data.history.filter((h) => {
          const d = new Date(h.date + "T00:00:00").getTime();
          return d >= Date.now() - 7 * 86400000;
        });
        const oldest = sevenDaysAgo[0] ?? latest;
        const postedThisWeek = (platform: "linkedin" | "instagram") =>
          db.data.pillarPosts
            .filter((p) => p.platform === platform && new Date(p.date + "T00:00:00").getTime() >= Date.now() - 7 * 86400000)
            .map((p) => p.headline);

        const input = {
          today,
          weekOfSprint: Math.round(week * 10) / 10,
          followerDeltas: {
            linkedin: (latest?.linkedin ?? 0) - (oldest?.linkedin ?? latest?.linkedin ?? 0),
            instagram: (latest?.instagram ?? 0) - (oldest?.instagram ?? latest?.instagram ?? 0),
          },
          pace: { linkedin: linkedinRanked.pace, instagram: instagramRanked.pace },
          pillarStats: { linkedin: linkedinRanked.stats, instagram: instagramRanked.stats },
          postedThisWeek: { linkedin: postedThisWeek("linkedin"), instagram: postedThisWeek("instagram") },
        };
        aiIdeas = await generateAIIdeas(input);
        db.data.aiCache = { generatedAt: new Date().toISOString(), ideas: aiIdeas };
        await db.write();
        engineUsed = "ai";
      } catch (err) {
        aiError = err instanceof Error ? err.message : "AI engine failed";
        engineUsed = "rule-based";
      }
    }
  }

  res.json({
    today,
    week,
    engineMode: db.data.settings.engineMode,
    engineUsed,
    aiAvailable,
    aiError,
    aiCacheGeneratedAt: db.data.aiCache.generatedAt,
    ruleBased: {
      linkedin: linkedinRanked,
      instagram: instagramRanked,
    },
    aiIdeas,
  });
});

app.listen(PORT, () => {
  console.log(`Growth Console API listening on http://localhost:${PORT}`);
});
