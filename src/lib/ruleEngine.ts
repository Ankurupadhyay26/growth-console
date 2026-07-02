import type { PillarPost, Platform } from "../data/types.ts";
import { seedBankFor, type SeedIdea } from "../data/seedBank.ts";
import { computePace, expectedFollowers, type Pace } from "./sprint.ts";

export interface PillarStat {
  pillar: string;
  postCount: number;
  avgEngagement: number;
  daysSinceLastPost: number | null;
  belowMedian: boolean;
  stale: boolean; // not posted in 10+ days
}

export interface RankedIdea extends SeedIdea {
  score: number;
  reason: string;
}

const TRAILING_DAYS = 21;

function engagementTotal(post: PillarPost): number {
  if (!post.engagement) return 0;
  return post.engagement.likes + post.engagement.comments + post.engagement.shares;
}

export function computePillarStats(posts: PillarPost[], platform: Platform, today: string): PillarStat[] {
  const cutoff = new Date(today + "T00:00:00").getTime() - TRAILING_DAYS * 86400000;
  const platformPosts = posts.filter((p) => p.platform === platform);
  const trailing = platformPosts.filter((p) => new Date(p.date + "T00:00:00").getTime() >= cutoff);

  const pillarGroups = new Map<string, PillarPost[]>();
  for (const p of trailing) {
    const arr = pillarGroups.get(p.pillar) ?? [];
    arr.push(p);
    pillarGroups.set(p.pillar, arr);
  }

  const avgByPillar = new Map<string, number>();
  for (const [pillar, group] of pillarGroups) {
    const avg = group.reduce((sum, p) => sum + engagementTotal(p), 0) / group.length;
    avgByPillar.set(pillar, avg);
  }
  const allAverages = [...avgByPillar.values()].sort((a, b) => a - b);
  const median =
    allAverages.length === 0
      ? 0
      : allAverages.length % 2 === 1
        ? allAverages[(allAverages.length - 1) / 2]
        : (allAverages[allAverages.length / 2 - 1] + allAverages[allAverages.length / 2]) / 2;

  const pillars = new Set<string>([...pillarGroups.keys(), ...seedBankFor(platform).map((s) => s.pillar)]);

  return [...pillars].map((pillar) => {
    const group = pillarGroups.get(pillar) ?? [];
    const avgEngagement = avgByPillar.get(pillar) ?? 0;
    const allPlatformPostsForPillar = platformPosts.filter((p) => p.pillar === pillar);
    const lastPost = allPlatformPostsForPillar
      .slice()
      .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    const daysSinceLastPost = lastPost
      ? Math.floor((new Date(today + "T00:00:00").getTime() - new Date(lastPost.date + "T00:00:00").getTime()) / 86400000)
      : null;

    return {
      pillar,
      postCount: group.length,
      avgEngagement,
      daysSinceLastPost,
      belowMedian: group.length >= 3 && avgEngagement < median,
      stale: daysSinceLastPost === null || daysSinceLastPost >= 10,
    };
  });
}

const LOW_EFFORT_FORMATS = new Set(["Reel"]);
const HIGH_EFFORT_FORMATS = new Set(["Carousel"]);

export function rankIdeas(
  platform: Platform,
  posts: PillarPost[],
  currentFollowers: number,
  weekFraction: number,
  today: string,
): { ideas: RankedIdea[]; stats: PillarStat[]; pace: Pace } {
  const stats = computePillarStats(posts, platform, today);
  const statByPillar = new Map(stats.map((s) => [s.pillar, s]));
  const expected = expectedFollowers(platform, weekFraction);
  const pace = computePace(currentFollowers, expected);

  const ideas = seedBankFor(platform).map((idea) => {
    const stat = statByPillar.get(idea.pillar);
    let score = 0;
    const reasons: string[] = [];

    if (stat) {
      // Reward higher engagement pillars
      score += stat.avgEngagement * 2;
      if (stat.belowMedian) {
        score -= 40;
        reasons.push("below-median engagement, deprioritized");
      }
      if (stat.stale) {
        score += 30;
        reasons.push(stat.daysSinceLastPost === null ? "never posted, needs a first test" : `untested for ${stat.daysSinceLastPost}d`);
      }
    }

    if (pace === "behind") {
      if (LOW_EFFORT_FORMATS.has(idea.format)) {
        score += 20;
        reasons.push("behind pace, biasing toward higher-frequency format");
      }
      if (HIGH_EFFORT_FORMATS.has(idea.format)) {
        score -= 15;
        reasons.push("behind pace, deprioritizing heavier format");
      }
    }

    return {
      ...idea,
      score,
      reason: reasons.join("; ") || "steady performer",
    };
  });

  ideas.sort((a, b) => b.score - a.score);

  return { ideas, stats, pace };
}
