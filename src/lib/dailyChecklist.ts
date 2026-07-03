import type { PostLog } from "../data/types";

export type ChecklistItemKind = "post" | "check";

export interface RequiredItem {
  id: string;
  kind: ChecklistItemKind;
  platform?: "linkedin" | "instagram";
  label: string;
}

export function isLinkedInDay(dow: number): boolean {
  return dow === 1 || dow === 3 || dow === 5;
}

export function requiredItemsForDay(dow: number): RequiredItem[] {
  if (dow === 0) {
    return [
      { id: "batch-linkedin", kind: "check", label: "Write all 3 LinkedIn posts for the week" },
      { id: "batch-content", kind: "check", label: "Film 4–5 Reels + 1 carousel" },
    ];
  }
  const items: RequiredItem[] = [];
  if (isLinkedInDay(dow)) {
    items.push({ id: "post-linkedin", kind: "post", platform: "linkedin", label: "Post on LinkedIn" });
  }
  items.push({ id: "post-instagram", kind: "post", platform: "instagram", label: "Post on Instagram" });
  items.push({ id: "reply-comments", kind: "check", label: "Reply to every comment/DM within 1 hour" });
  items.push({ id: "comment-niche", kind: "check", label: "Comment on 15–20 posts in my niche" });
  return items;
}

export function computeStreak(
  fromDate: string,
  postLog: PostLog,
  checklistHistory: { date: string; completed: string[] }[],
): number {
  const byDate = new Map(checklistHistory.map((h) => [h.date, h]));
  let streak = 0;
  let cursor = fromDate;
  for (let i = 0; i < 90; i++) {
    const dow = new Date(cursor + "T00:00:00").getDay();
    const required = requiredItemsForDay(dow);
    const entry = byDate.get(cursor);
    const postEntry = postLog[cursor];
    const done = required.every((item) =>
      item.kind === "post" ? !!postEntry?.[item.platform!] : entry ? entry.completed.includes(item.id) : false,
    );
    if (!done) break;
    streak += 1;
    const d = new Date(cursor + "T00:00:00");
    d.setDate(d.getDate() - 1);
    cursor = d.toISOString().slice(0, 10);
  }
  return streak;
}
