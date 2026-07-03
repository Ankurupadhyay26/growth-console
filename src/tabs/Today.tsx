import { useEffect, useState } from "react";
import { api, type ContentFeedResponse, type SprintInfo } from "../lib/api";
import { todayISO } from "../lib/sprint";
import { isLinkedInDay, computeStreak } from "../lib/dailyChecklist";
import { showToast } from "../lib/toast";
import type { PostLog } from "../data/types";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Idea {
  pillar: string;
  headline: string;
}

interface ChecklistState {
  date: string;
  completed: string[];
}

export function Today() {
  const [sprint, setSprint] = useState<SprintInfo | null>(null);
  const [feed, setFeed] = useState<ContentFeedResponse | null>(null);
  const [postLog, setPostLog] = useState<PostLog>({});
  const [checklist, setChecklist] = useState<ChecklistState>({ date: todayISO(), completed: [] });
  const [checklistHistory, setChecklistHistory] = useState<ChecklistState[]>([]);
  const [loading, setLoading] = useState(true);
  const [liPick, setLiPick] = useState(0);
  const [igPick, setIgPick] = useState(0);

  const today = todayISO();
  const dow = new Date(today + "T00:00:00").getDay();
  const isSunday = dow === 0;

  function load() {
    Promise.all([
      api.getSprint(),
      api.getContentFeed(),
      api.getPostLog(),
      api.getChecklist(today),
      api.getChecklistHistory(),
    ])
      .then(([s, f, pl, cl, clh]) => {
        setSprint(s);
        setFeed(f);
        setPostLog(pl);
        setChecklist(cl);
        setChecklistHistory(clh);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !sprint || !feed) {
    return <div className="text-graphite-400 text-sm p-8">Loading today's plan...</div>;
  }

  const usingAI = feed.engineUsed === "ai" && feed.aiIdeas;
  const liIdeas: Idea[] = (usingAI ? feed.aiIdeas!.linkedin : feed.ruleBased.linkedin.ideas) ?? [];
  const igIdeas: Idea[] = (usingAI ? feed.aiIdeas!.instagram : feed.ruleBased.instagram.ideas) ?? [];
  const liIdea = liIdeas[liPick] ?? liIdeas[0];
  const igIdea = igIdeas[igPick] ?? igIdeas[0];

  const liPosted = !!postLog[today]?.linkedin;
  const igPosted = !!postLog[today]?.instagram;

  async function markPost(platform: "linkedin" | "instagram", idea: Idea) {
    await api.addPillarPost({ platform, pillar: idea.pillar, date: today, headline: idea.headline });
    const pl = await api.getPostLog();
    setPostLog(pl);
    showToast(`Nice — logged your ${platform === "linkedin" ? "LinkedIn" : "Instagram"} post`);
  }

  async function toggleCheck(itemId: string) {
    const checked = !checklist.completed.includes(itemId);
    const updated = await api.setChecklistItem(today, itemId, checked);
    setChecklist(updated);
    setChecklistHistory((h) => [...h.filter((c) => c.date !== today), updated]);
  }

  const streak = computeStreak(today, postLog, checklistHistory);

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="console-panel p-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-graphite-400 mb-1">Day {sprint.day} of 90</p>
          <p className="text-2xl font-semibold">{DAY_NAMES[dow]}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-graphite-400 mb-1">Streak</p>
          <p className="font-metric text-2xl font-bold text-graphite-100">{streak}d</p>
        </div>
      </div>

      <div className="console-panel p-5 flex flex-col gap-3">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-graphite-300">
          {isSunday ? "Today's To-Do — Batch Day" : "Today's To-Do"}
        </h2>

        {isSunday ? (
          <>
            <CheckRow
              label="Write all 3 LinkedIn posts for the week"
              checked={checklist.completed.includes("batch-linkedin")}
              onToggle={() => toggleCheck("batch-linkedin")}
              accent="linkedin"
            />
            <CheckRow
              label="Film 4–5 Reels + 1 carousel"
              checked={checklist.completed.includes("batch-content")}
              onToggle={() => toggleCheck("batch-content")}
              accent="instagram"
            />
          </>
        ) : (
          <>
            {isLinkedInDay(dow) && liIdea && (
              <PostRow
                platform="linkedin"
                idea={liIdea}
                alternates={liIdeas.filter((_, i) => i !== liPick).slice(0, 2)}
                posted={liPosted}
                onPost={() => markPost("linkedin", liIdea)}
                onPickAlternate={(idea) => setLiPick(liIdeas.indexOf(idea))}
              />
            )}
            {igIdea && (
              <PostRow
                platform="instagram"
                idea={igIdea}
                alternates={igIdeas.filter((_, i) => i !== igPick).slice(0, 2)}
                posted={igPosted}
                onPost={() => markPost("instagram", igIdea)}
                onPickAlternate={(idea) => setIgPick(igIdeas.indexOf(idea))}
              />
            )}
            <CheckRow
              label="Reply to every comment/DM within 1 hour"
              checked={checklist.completed.includes("reply-comments")}
              onToggle={() => toggleCheck("reply-comments")}
            />
            <CheckRow
              label="Comment on 15–20 posts in my niche"
              checked={checklist.completed.includes("comment-niche")}
              onToggle={() => toggleCheck("comment-niche")}
            />
          </>
        )}

        <div className="border-t border-graphite-750 pt-3 text-xs text-graphite-400 flex items-start gap-2">
          <span
            className="mt-0.5 w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: "var(--color-instagram-400)" }}
          />
          <span>
            <span className="text-graphite-200 font-medium">Trend-react (~15 min):</span> check today's AI/PM news
            for a same-day Reel or comment-jack. Opportunistic — not a checkbox.
          </span>
        </div>
      </div>

      <p className="text-center text-xs text-graphite-500">
        Want more topic options, past entries, or full analytics? Open <span className="text-graphite-300">More</span> in
        the header.
      </p>
    </div>
  );
}

function CheckRow({
  label,
  checked,
  onToggle,
  accent,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  accent?: "linkedin" | "instagram";
}) {
  const color = accent === "linkedin" ? "var(--color-linkedin-500)" : accent === "instagram" ? "var(--color-instagram-500)" : undefined;
  return (
    <label className="flex items-center gap-3 text-sm cursor-pointer p-3 rounded-lg border border-graphite-750 bg-graphite-900/40 hover:bg-graphite-900/70 transition">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="w-4 h-4 shrink-0"
        style={color ? { accentColor: color } : undefined}
      />
      <span className={checked ? "text-graphite-500 line-through" : "text-graphite-200"}>{label}</span>
    </label>
  );
}

function PostRow({
  platform,
  idea,
  alternates,
  posted,
  onPost,
  onPickAlternate,
}: {
  platform: "linkedin" | "instagram";
  idea: Idea;
  alternates: Idea[];
  posted: boolean;
  onPost: () => void;
  onPickAlternate: (idea: Idea) => void;
}) {
  const [showAlt, setShowAlt] = useState(false);
  const color = platform === "linkedin" ? "var(--color-linkedin-400)" : "var(--color-instagram-400)";
  const label = platform === "linkedin" ? "LinkedIn" : "Instagram";

  return (
    <div
      className="rounded-lg border border-graphite-750 p-3.5 flex flex-col gap-2"
      style={{ backgroundColor: posted ? "rgba(52, 211, 153, 0.06)" : "var(--color-graphite-900)" }}
    >
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={posted}
          disabled={posted}
          onChange={() => !posted && onPost()}
          className="w-4 h-4 mt-1 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color }}>
            Post on {label} · {idea.pillar}
          </p>
          <p className={`text-sm mt-0.5 ${posted ? "text-graphite-500 line-through" : "text-graphite-100"}`}>
            {idea.headline}
          </p>
        </div>
      </label>
      {!posted && alternates.length > 0 && (
        <div className="pl-7">
          <button
            onClick={() => setShowAlt((v) => !v)}
            className="text-[11px] text-graphite-500 hover:text-graphite-300 underline underline-offset-2"
          >
            {showAlt ? "Hide other topics" : "Not feeling this topic? See alternatives"}
          </button>
          {showAlt && (
            <ul className="mt-2 flex flex-col gap-1.5">
              {alternates.map((alt, i) => (
                <li key={i}>
                  <button
                    onClick={() => {
                      onPickAlternate(alt);
                      setShowAlt(false);
                    }}
                    className="text-left text-xs text-graphite-400 hover:text-graphite-100"
                  >
                    <span className="text-graphite-600">[{alt.pillar}]</span> {alt.headline}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
