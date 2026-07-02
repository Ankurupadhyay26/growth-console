import { MILESTONES } from "../data/types";
import type { Platform } from "../data/types";
import type { Pace } from "../lib/sprint";

interface GaugeProps {
  platform: Platform;
  current: number;
  target: number;
  starting: number;
  pace: Pace;
  weekOfSprint: number;
  realityCheck?: string;
}

const PLATFORM_META: Record<Platform, { label: string; color: string; glow: string }> = {
  linkedin: { label: "LinkedIn", color: "var(--color-linkedin-500)", glow: "var(--color-linkedin-400)" },
  instagram: { label: "Instagram", color: "var(--color-instagram-500)", glow: "var(--color-instagram-400)" },
};

const PACE_META: Record<Pace, { label: string; color: string; icon: string }> = {
  ahead: { label: "AHEAD", color: "var(--color-signal-good)", icon: "↑" },
  "on-track": { label: "ON TRACK", color: "var(--color-signal-warn)", icon: "→" },
  behind: { label: "BEHIND", color: "var(--color-signal-bad)", icon: "↓" },
};

const PACE_EXPLAINER =
  "Pace compares today's follower count to where the milestone curve says you should be, linearly interpolated between the week 0/4/8/12 targets. Within 3% of the curve counts as on track.";

export function Gauge({ platform, current, target, starting, pace, weekOfSprint, realityCheck }: GaugeProps) {
  const meta = PLATFORM_META[platform];
  const paceMeta = PACE_META[pace];
  const range = target - starting;
  const progressPct = Math.max(0, Math.min(100, ((current - starting) / range) * 100));

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const arcFraction = 0.75; // 270-degree gauge
  const arcLength = circumference * arcFraction;

  const filledLength = (progressPct / 100) * arcLength;

  return (
    <div className="console-panel p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide uppercase" style={{ color: meta.color }}>
          {meta.label}
        </h3>
        <span
          title={PACE_EXPLAINER}
          className="text-xs font-metric px-2 py-0.5 rounded-full border flex items-center gap-1 cursor-help"
          style={{ color: paceMeta.color, borderColor: paceMeta.color }}
        >
          <span aria-hidden="true">{paceMeta.icon}</span>
          {paceMeta.label}
        </span>
      </div>

      <div className="relative flex items-center justify-center py-2">
        <svg viewBox="0 0 200 200" className="w-48 h-48 -rotate-[135deg]">
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="var(--color-graphite-750)"
            strokeWidth="14"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={meta.color}
            strokeWidth="14"
            strokeDasharray={`${filledLength} ${circumference}`}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${meta.glow})` }}
          />
          {MILESTONES.filter((m) => m.week > 0).map((m) => {
            const milestonePct = ((m[platform] - starting) / range) * 100;
            const angle = (milestonePct / 100) * arcFraction * 360;
            const rad = (angle * Math.PI) / 180;
            const x1 = 100 + (radius - 9) * Math.cos(rad);
            const y1 = 100 + (radius - 9) * Math.sin(rad);
            const x2 = 100 + (radius + 9) * Math.cos(rad);
            const y2 = 100 + (radius + 9) * Math.sin(rad);
            const passed = weekOfSprint >= m.week;
            return (
              <line
                key={m.week}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={passed ? "var(--color-graphite-100)" : "var(--color-graphite-500)"}
                strokeWidth="2.5"
              />
            );
          })}
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-metric text-3xl font-bold text-graphite-100">{Math.round(current).toLocaleString()}</span>
          <span className="font-metric text-xs text-graphite-400">of {target.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex justify-between text-[11px] font-metric text-graphite-400 px-1">
        {MILESTONES.map((m) => (
          <div key={m.week} className="flex flex-col items-center gap-0.5">
            <span className={weekOfSprint >= m.week ? "text-graphite-100" : ""}>W{m.week}</span>
            <span>{m[platform].toLocaleString()}</span>
          </div>
        ))}
      </div>

      {realityCheck && (
        <p className="text-[11px] leading-snug text-graphite-400 border-t border-graphite-750 pt-3">
          <span className="text-signal-warn font-semibold" style={{ color: "var(--color-signal-warn)" }}>
            Reality check:
          </span>{" "}
          {realityCheck}
        </p>
      )}
    </div>
  );
}
