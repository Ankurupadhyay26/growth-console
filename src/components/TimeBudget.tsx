import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { todayISO } from "../lib/sprint";

interface ChecklistItem {
  id: string;
  label: string;
}

const SUNDAY_ITEMS: ChecklistItem[] = [
  { id: "batch-linkedin", label: "Write all 3 LinkedIn posts for the week" },
  { id: "batch-content", label: "Film 4–5 Reels + 1 carousel" },
];

const WEEKDAY_ITEMS: ChecklistItem[] = [
  { id: "post-today", label: "Post today's content" },
  { id: "reply-comments", label: "Reply to every comment/DM within 1 hour" },
  { id: "comment-niche", label: "Comment on 15–20 posts in my niche" },
];

function itemsForDay(dow: number): ChecklistItem[] {
  return dow === 0 ? SUNDAY_ITEMS : WEEKDAY_ITEMS;
}

export function TimeBudget() {
  const [date] = useState(todayISO());
  const [completed, setCompleted] = useState<string[]>([]);
  const [history, setHistory] = useState<{ date: string; completed: string[] }[]>([]);
  const [loading, setLoading] = useState(true);

  const dow = new Date(date + "T00:00:00").getDay();
  const items = itemsForDay(dow);
  const isBatchDay = dow === 0;

  useEffect(() => {
    Promise.all([api.getChecklist(date), api.getChecklistHistory()])
      .then(([today, hist]) => {
        setCompleted(today.completed);
        setHistory(hist);
      })
      .finally(() => setLoading(false));
  }, [date]);

  async function toggle(itemId: string) {
    const checked = !completed.includes(itemId);
    const updated = await api.setChecklistItem(date, itemId, checked);
    setCompleted(updated.completed);
    setHistory((h) => {
      const rest = h.filter((c) => c.date !== date);
      return [...rest, updated];
    });
  }

  const streak = computeStreak(history, date);

  if (loading) return null;

  return (
    <div className="console-panel p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-graphite-300">
          Daily Time Budget {isBatchDay && <span style={{ color: "var(--color-linkedin-400)" }}>· Batch Day</span>}
        </h3>
        <span className="text-xs font-metric text-graphite-400">
          Streak: <span className="text-graphite-100 font-bold">{streak}d</span>
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id}>
            <label className="flex items-center gap-2.5 text-sm cursor-pointer group">
              <input
                type="checkbox"
                checked={completed.includes(item.id)}
                onChange={() => toggle(item.id)}
                className="w-4 h-4 accent-linkedin-500"
              />
              <span className={completed.includes(item.id) ? "text-graphite-500 line-through" : "text-graphite-200"}>
                {item.label}
              </span>
            </label>
          </li>
        ))}
      </ul>

      <div className="border-t border-graphite-750 pt-3 text-xs text-graphite-400 flex items-start gap-2">
        <span
          className="mt-0.5 w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: "var(--color-instagram-400)" }}
        />
        <span>
          <span className="text-graphite-200 font-medium">Trend-react slot (~15 min, every day):</span> check today's
          AI/PM news for a same-day Reel or comment-jack opportunity. Opportunistic — not a checkbox.
        </span>
      </div>
    </div>
  );
}

function computeStreak(history: { date: string; completed: string[] }[], fromDate: string): number {
  const byDate = new Map(history.map((h) => [h.date, h]));
  let streak = 0;
  let cursor = fromDate;
  for (let i = 0; i < 90; i++) {
    const dow = new Date(cursor + "T00:00:00").getDay();
    const required = itemsForDay(dow).map((it) => it.id);
    const entry = byDate.get(cursor);
    const done = entry ? required.every((id) => entry.completed.includes(id)) : false;
    if (!done) break;
    streak += 1;
    const d = new Date(cursor + "T00:00:00");
    d.setDate(d.getDate() - 1);
    cursor = d.toISOString().slice(0, 10);
  }
  return streak;
}
