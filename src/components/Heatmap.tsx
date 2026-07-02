import type { PostLog } from "../data/types";
import { SPRINT_WEEKS } from "../data/types";

interface HeatmapProps {
  sprintStart: string;
  postLog: PostLog;
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function addDays(dateISO: string, days: number): string {
  const d = new Date(dateISO + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function Heatmap({ sprintStart, postLog }: HeatmapProps) {
  const start = new Date(sprintStart + "T00:00:00");
  const startWeekday = start.getDay(); // 0=Sun
  const gridStart = addDays(sprintStart, -startWeekday);
  const today = new Date().toISOString().slice(0, 10);

  const weeks: string[][] = [];
  for (let w = 0; w < SPRINT_WEEKS + 1; w++) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(addDays(gridStart, w * 7 + d));
    }
    weeks.push(week);
  }

  return (
    <div className="console-panel p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-graphite-300">Posting Activity</h3>
        <div className="flex items-center gap-3 text-[11px] text-graphite-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--color-linkedin-500)" }} />
            LinkedIn
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--color-instagram-500)" }} />
            Instagram
          </span>
        </div>
      </div>
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        <div className="flex flex-col gap-[3px] mr-1 text-[10px] text-graphite-500 font-metric">
          {DAY_LABELS.map((d, i) => (
            <span key={i} className="w-3 h-3.5 leading-[14px]">
              {d}
            </span>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((date) => {
              const inSprint = date >= sprintStart && date <= addDays(sprintStart, SPRINT_WEEKS * 7);
              const isFuture = date > today;
              const entry = postLog[date];
              const li = entry?.linkedin;
              const ig = entry?.instagram;
              return (
                <div
                  key={date}
                  title={`${date}${li ? " · LinkedIn posted" : ""}${ig ? " · Instagram posted" : ""}`}
                  className="w-3.5 h-3.5 rounded-[3px] flex overflow-hidden"
                  style={{
                    backgroundColor: !inSprint ? "transparent" : "var(--color-graphite-800)",
                    opacity: isFuture ? 0.4 : 1,
                  }}
                >
                  {inSprint && (
                    <>
                      <div
                        className="w-1/2 h-full"
                        style={{ backgroundColor: li ? "var(--color-linkedin-500)" : "var(--color-graphite-800)" }}
                      />
                      <div
                        className="w-1/2 h-full"
                        style={{ backgroundColor: ig ? "var(--color-instagram-500)" : "var(--color-graphite-800)" }}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
