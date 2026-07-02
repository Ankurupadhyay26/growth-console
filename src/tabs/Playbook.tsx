const LINKEDIN_PILLARS = [
  { name: "Contrarian Take", day: "Monday" },
  { name: "Universal Story (no company names)", day: "Wednesday" },
  { name: "Life → PM Analogy (food/travel/fashion/music)", day: "Friday" },
  { name: "PM Career Levels", day: "rotates in on Friday" },
  { name: "Hot Take on AI/GenAI Hype", day: "rotates in on Monday" },
];

const INSTAGRAM_PILLARS = [
  { name: "AI Tool Breakdown", format: "Reel" },
  { name: "PM Career Tip", format: "Reel" },
  { name: "Data Product Mini-Lesson", format: "Carousel" },
  { name: "POV / Hot Take", format: "Reel" },
  { name: "Trend-Jack", format: "Reel" },
  { name: "Day in the Life", format: "Reel, ~1x/week" },
];

export function Playbook() {
  return (
    <div className="flex flex-col gap-6">
      <div className="console-panel p-5">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-graphite-300 mb-4">
          Daily Time Budget (2–3 hrs/day total)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BudgetBlock title="Sunday — Batch Day" subtitle="~2.5–3 hrs">
            <ul className="list-disc list-inside space-y-1">
              <li>Write the week's 3 LinkedIn posts</li>
              <li>Film 4–5 Reels + 1 carousel in one sitting</li>
            </ul>
          </BudgetBlock>
          <BudgetBlock title="Mon–Sat" subtitle="~30–45 min/day">
            <ol className="list-decimal list-inside space-y-1">
              <li>Post today's content</li>
              <li>Reply to every comment/DM within the first hour</li>
              <li>Comment on 15–20 posts in my niche</li>
            </ol>
          </BudgetBlock>
          <BudgetBlock title="Every Day — Buffer" subtitle="~15 min">
            <p>Same-day trend-react slot — can't be batched, opportunistic by nature.</p>
          </BudgetBlock>
        </div>
        <p className="text-xs text-graphite-400 mt-4 border-t border-graphite-750 pt-3 leading-relaxed">
          <span className="text-graphite-200 font-medium">Why this matters: </span>
          Comments in the first hour and DM shares are ranking signals as strong as the post itself —
          engagement time matters as much as creation time.
        </p>
      </div>

      <div className="console-panel p-5" style={{ borderColor: "var(--color-linkedin-500)" }}>
        <h3 className="text-sm font-semibold tracking-wide uppercase mb-4" style={{ color: "var(--color-linkedin-400)" }}>
          LinkedIn Rules
        </h3>
        <ul className="space-y-2 text-sm text-graphite-200">
          <li>Post 3x/week: Monday, Wednesday, Friday</li>
          <li>Under 150 words per post, short paragraphs (max 2 lines) — no bullet points, use line breaks</li>
          <li>End every post with a question or a one-line thought-provoking kicker</li>
          <li>Max 3 hashtags, or none</li>
          <li>Engage with comments in the first hour — this is a real ranking signal</li>
        </ul>
        <div className="mt-4 pt-3 border-t border-graphite-750">
          <p className="text-xs uppercase tracking-wide text-graphite-500 mb-2">Content pillars to rotate</p>
          <ul className="text-sm text-graphite-300 space-y-1.5">
            {LINKEDIN_PILLARS.map((p) => (
              <li key={p.name} className="flex justify-between gap-4">
                <span>{p.name}</span>
                <span className="text-graphite-500 font-metric text-xs whitespace-nowrap">{p.day}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="console-panel p-5" style={{ borderColor: "var(--color-instagram-500)" }}>
        <h3 className="text-sm font-semibold tracking-wide uppercase mb-4" style={{ color: "var(--color-instagram-400)" }}>
          Instagram Rules
        </h3>
        <ul className="space-y-2 text-sm text-graphite-200">
          <li>Reels are the primary discovery engine — prioritize them over static posts for growth</li>
          <li>First 2–3 seconds decide everything: open with a hook, no slow intros</li>
          <li>Aim for 3–5 Reels/week; quality beats frequency — one bad post can suppress reach on the next few</li>
          <li>Saves and shares (especially DM shares) outrank likes as a ranking signal</li>
          <li>Carousels are best for saves/engagement depth; Reels are best for reach — use both</li>
          <li>Use on-screen captions (many people watch muted)</li>
          <li>Avoid reposting anything with a TikTok watermark — original content only</li>
          <li>Commit to the niche (AI/Data/PM) for the full 3 months — switching topics confuses the algorithm's targeting</li>
        </ul>
        <div className="mt-4 pt-3 border-t border-graphite-750">
          <p className="text-xs uppercase tracking-wide text-graphite-500 mb-2">Content pillars</p>
          <ul className="text-sm text-graphite-300 space-y-1.5">
            {INSTAGRAM_PILLARS.map((p) => (
              <li key={p.name} className="flex justify-between gap-4">
                <span>{p.name}</span>
                <span className="text-graphite-500 font-metric text-xs whitespace-nowrap">{p.format}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function BudgetBlock({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-graphite-750 bg-graphite-900/60 p-4">
      <p className="text-sm font-semibold text-graphite-100">{title}</p>
      <p className="text-xs font-metric text-graphite-500 mb-2">{subtitle}</p>
      <div className="text-sm text-graphite-300">{children}</div>
    </div>
  );
}
