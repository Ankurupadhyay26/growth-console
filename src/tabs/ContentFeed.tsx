import { useEffect, useState } from "react";
import { api, type ContentFeedResponse } from "../lib/api";
import { LINKEDIN_DAY_PILLAR, LINKEDIN_SEED, INSTAGRAM_SEED } from "../data/seedBank";
import { todayISO } from "../lib/sprint";
import { showToast } from "../lib/toast";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const LINKEDIN_FOCUS: Record<number, string> = {
  1: "Contrarian Take — open the week with a strong opinion",
  3: "Universal Story — no company names, just the lesson",
  5: "Life → PM Analogy or Career Levels — close the week reflective",
};
const LINKEDIN_DEFAULT_FOCUS = "No LinkedIn post scheduled today — Mon/Wed/Fri cadence";

export function ContentFeed() {
  const [feed, setFeed] = useState<ContentFeedResponse | null>(null);
  const [settings, setSettings] = useState<{ engineMode: "ai" | "rule-based"; aiAvailable: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [postedToday, setPostedToday] = useState<Set<string>>(new Set());
  const [showBatch, setShowBatch] = useState(false);

  const today = todayISO();
  const dow = new Date(today + "T00:00:00").getDay();

  function load() {
    Promise.all([api.getContentFeed(), api.getSettings()]).then(([f, s]) => {
      setFeed(f);
      setSettings(s);
    }).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    setShowBatch(dow === 0);
  }, []);

  async function handleEngineChange(mode: "ai" | "rule-based") {
    if (!settings) return;
    await api.setSettings(mode);
    setLoading(true);
    load();
    showToast(mode === "ai" ? "Switched to AI Engine" : "Switched to Rule-Based Engine", "info");
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const f = await api.getContentFeed(true);
      setFeed(f);
      showToast("Ideas refreshed");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to refresh ideas", "error");
    } finally {
      setRefreshing(false);
    }
  }

  async function markPosted(platform: "linkedin" | "instagram", pillar: string, headline: string) {
    await api.addPillarPost({ platform, pillar, date: today, headline });
    setPostedToday((s) => new Set(s).add(`${platform}:${headline}`));
    showToast(`Logged on ${platform === "linkedin" ? "LinkedIn" : "Instagram"} — added to today's heatmap`);
  }

  if (loading || !feed || !settings) {
    return <div className="text-graphite-400 text-sm p-8">Loading content feed...</div>;
  }

  const linkedinFocus = LINKEDIN_FOCUS[dow] ?? LINKEDIN_DEFAULT_FOCUS;
  const instagramFocus = "Reels are the discovery engine — aim for a hook in the first 2-3 seconds.";

  const usingAI = feed.engineUsed === "ai" && feed.aiIdeas;

  return (
    <div className="flex flex-col gap-6">
      <div className="console-panel p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-graphite-400 mb-1">Today</p>
          <p className="text-xl font-semibold">{DAY_NAMES[dow]}</p>
        </div>
        <div className="flex-1 min-w-[220px]">
          <p className="text-xs uppercase tracking-wide text-graphite-400 mb-1" style={{ color: "var(--color-linkedin-400)" }}>
            LinkedIn Focus
          </p>
          <p className="text-sm text-graphite-200">{linkedinFocus}</p>
        </div>
        <div className="flex-1 min-w-[220px]">
          <p className="text-xs uppercase tracking-wide text-graphite-400 mb-1" style={{ color: "var(--color-instagram-400)" }}>
            Instagram Focus
          </p>
          <p className="text-sm text-graphite-200">{instagramFocus}</p>
        </div>
      </div>

      <div className="console-panel p-4 flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-graphite-400">Suggestion engine:</span>
            <div className="flex rounded-lg border border-graphite-700 overflow-hidden">
              <button
                onClick={() => handleEngineChange("rule-based")}
                className={`px-3 py-1.5 ${settings.engineMode === "rule-based" ? "bg-graphite-700 text-graphite-100" : "text-graphite-400 hover:text-graphite-200"}`}
              >
                Rule-Based
              </button>
              <button
                onClick={() => settings.aiAvailable && handleEngineChange("ai")}
                disabled={!settings.aiAvailable}
                title={settings.aiAvailable ? "" : "Add ANTHROPIC_API_KEY to your .env file to enable the AI Engine"}
                className={`px-3 py-1.5 ${settings.engineMode === "ai" ? "bg-graphite-700 text-graphite-100" : "text-graphite-400 hover:text-graphite-200"} ${!settings.aiAvailable ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                AI Engine
              </button>
            </div>
          </div>

          {feed.aiError && (
            <p className="text-[11px]" style={{ color: "var(--color-signal-warn)" }}>
              AI Engine error, fell back to Rule-Based: {feed.aiError}
            </p>
          )}

          {settings.engineMode === "ai" && settings.aiAvailable && (
            <div className="flex items-center gap-2 text-[11px] text-graphite-500">
              {feed.aiCacheGeneratedAt && <span>Generated {new Date(feed.aiCacheGeneratedAt).toLocaleString()}</span>}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-2.5 py-1 rounded-md border border-graphite-700 text-graphite-300 hover:bg-graphite-800 disabled:opacity-50"
              >
                {refreshing ? "Refreshing..." : "Refresh ideas"}
              </button>
            </div>
          )}

          <button
            onClick={() => setShowBatch((v) => !v)}
            className="text-[11px] px-2.5 py-1 rounded-md border border-graphite-700 text-graphite-300 hover:bg-graphite-800 ml-auto"
          >
            {showBatch ? "Hide" : "Show"} Sunday Batch Planning
          </button>
        </div>

        <p className="text-[11px] text-graphite-500 leading-snug">
          {settings.engineMode === "ai" && settings.aiAvailable ? (
            <>AI Engine asks Claude to write fresh ideas that react to this week's actual pace and pillar performance, cached for 24h.</>
          ) : (
            <>Rule-Based ranks your seed bank by trailing pillar engagement, surfaces untested pillars, and biases toward lower-effort formats when a platform is behind pace.</>
          )}
          {!settings.aiAvailable && (
            <>
              {" "}
              No <code className="text-graphite-400">ANTHROPIC_API_KEY</code> found in <code className="text-graphite-400">.env</code> — add one to unlock the AI Engine.
            </>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PlatformIdeas
          platform="linkedin"
          usingAI={!!usingAI}
          aiIdeas={feed.aiIdeas?.linkedin ?? []}
          ranked={feed.ruleBased.linkedin.ideas}
          postedToday={postedToday}
          onMark={markPosted}
        />
        <PlatformIdeas
          platform="instagram"
          usingAI={!!usingAI}
          aiIdeas={feed.aiIdeas?.instagram ?? []}
          ranked={feed.ruleBased.instagram.ideas}
          postedToday={postedToday}
          onMark={markPosted}
        />
      </div>

      {showBatch && <BatchPlanning />}
    </div>
  );
}

function PlatformIdeas({
  platform,
  usingAI,
  aiIdeas,
  ranked,
  postedToday,
  onMark,
}: {
  platform: "linkedin" | "instagram";
  usingAI: boolean;
  aiIdeas: { pillar: string; headline: string }[];
  ranked: { pillar: string; format: string; headline: string; reason: string }[];
  postedToday: Set<string>;
  onMark: (platform: "linkedin" | "instagram", pillar: string, headline: string) => void;
}) {
  const color = platform === "linkedin" ? "var(--color-linkedin-400)" : "var(--color-instagram-400)";
  const items = usingAI ? aiIdeas.slice(0, 3) : ranked.slice(0, 3);

  return (
    <div className="console-panel p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide uppercase" style={{ color }}>
          {platform === "linkedin" ? "LinkedIn" : "Instagram"} Ideas
        </h3>
        <span className="text-[10px] uppercase tracking-wide text-graphite-500">
          {usingAI ? "AI Engine" : "Rule-Based"}
        </span>
      </div>
      {items.map((idea, i) => {
        const key = `${platform}:${idea.headline}`;
        const posted = postedToday.has(key);
        return (
          <div key={i} className="rounded-lg border border-graphite-750 bg-graphite-900/60 p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-graphite-400">
                {idea.pillar}
                {"format" in idea && idea.format ? ` · ${(idea as any).format}` : ""}
              </span>
            </div>
            <p className="text-sm text-graphite-100 leading-snug">{idea.headline}</p>
            {"reason" in idea && (idea as any).reason && (
              <p className="text-[11px] text-graphite-500 italic">{(idea as any).reason}</p>
            )}
            <button
              onClick={() => onMark(platform, idea.pillar, idea.headline)}
              disabled={posted}
              className="self-start text-xs mt-1 px-3 py-1.5 rounded-md font-medium disabled:opacity-50"
              style={{ backgroundColor: posted ? "var(--color-graphite-750)" : color, color: posted ? "var(--color-graphite-400)" : "#0a0c10" }}
            >
              {posted ? "Marked as posted" : "Mark as posted"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function BatchPlanning() {
  const weekdayPillars = [1, 3, 5].map((dow) => ({
    dow,
    dayName: DAY_NAMES[dow],
    ideas: (LINKEDIN_DAY_PILLAR[dow] ?? []).flatMap((pillar) =>
      LINKEDIN_SEED.filter((s) => s.pillar === pillar).slice(0, 1),
    ),
  }));
  const igIdeas = INSTAGRAM_SEED.slice(0, 5);

  return (
    <div className="console-panel p-5">
      <h3 className="text-sm font-semibold tracking-wide uppercase text-graphite-300 mb-1">
        Sunday Batch Planning — Whole Week At Once
      </h3>
      <p className="text-xs text-graphite-500 mb-4">
        Write all 3 LinkedIn posts and film 4–5 Reels + 1 carousel in one sitting.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-semibold uppercase text-graphite-400 mb-2" style={{ color: "var(--color-linkedin-400)" }}>
            LinkedIn — Mon / Wed / Fri
          </p>
          <ul className="flex flex-col gap-2">
            {weekdayPillars.map(({ dow, dayName, ideas }) => (
              <li key={dow} className="text-sm">
                <span className="text-graphite-400 font-metric text-xs mr-2">{dayName.slice(0, 3)}</span>
                {ideas.length > 0 ? (
                  <span className="text-graphite-200">
                    <span className="text-graphite-500">[{ideas[0].pillar}]</span> {ideas[0].headline}
                  </span>
                ) : (
                  <span className="text-graphite-600">—</span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-graphite-400 mb-2" style={{ color: "var(--color-instagram-400)" }}>
            Instagram — this week's shoot list
          </p>
          <ul className="flex flex-col gap-2">
            {igIdeas.map((idea, i) => (
              <li key={i} className="text-sm text-graphite-200">
                <span className="text-graphite-500">[{idea.format}]</span> {idea.headline}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
