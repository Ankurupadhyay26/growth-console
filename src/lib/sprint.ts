import { MILESTONES, SPRINT_WEEKS, type Platform } from "../data/types.ts";

export type Pace = "ahead" | "on-track" | "behind";

export function dayOfSprint(sprintStart: string, today: string = todayISO()): number {
  const start = new Date(sprintStart + "T00:00:00");
  const now = new Date(today + "T00:00:00");
  const diffMs = now.getTime() - start.getTime();
  return Math.floor(diffMs / 86400000) + 1; // Day 1 = sprint start
}

export function todayISO(): string {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export function weekOfSprint(sprintStart: string, today: string = todayISO()): number {
  const day = dayOfSprint(sprintStart, today);
  return Math.max(0, (day - 1) / 7);
}

/** Linear interpolation of the expected follower count for a platform at a given
 * fractional week, based on the milestone table. */
export function expectedFollowers(platform: Platform, weekFraction: number): number {
  const clamped = Math.max(0, Math.min(SPRINT_WEEKS, weekFraction));
  for (let i = 0; i < MILESTONES.length - 1; i++) {
    const a = MILESTONES[i];
    const b = MILESTONES[i + 1];
    if (clamped >= a.week && clamped <= b.week) {
      const span = b.week - a.week;
      const t = span === 0 ? 0 : (clamped - a.week) / span;
      return a[platform] + t * (b[platform] - a[platform]);
    }
  }
  return MILESTONES[MILESTONES.length - 1][platform];
}

export function computePace(current: number, expected: number): Pace {
  if (expected <= 0) return "on-track";
  const ratio = (current - expected) / expected;
  if (ratio >= 0.03) return "ahead";
  if (ratio <= -0.03) return "behind";
  return "on-track";
}

export function paceLabel(pace: Pace): string {
  switch (pace) {
    case "ahead":
      return "Ahead";
    case "behind":
      return "Behind";
    default:
      return "On track";
  }
}
