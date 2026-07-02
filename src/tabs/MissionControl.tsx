import { useEffect, useState } from "react";
import { api, type SprintInfo } from "../lib/api";
import { Gauge } from "../components/Gauge";
import { Heatmap } from "../components/Heatmap";
import { computePace, expectedFollowers } from "../lib/sprint";
import { STARTING, TARGETS, type HistoryEntry, type PostLog } from "../data/types";

export function MissionControl() {
  const [sprint, setSprint] = useState<SprintInfo | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [postLog, setPostLog] = useState<PostLog>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getSprint(), api.getHistory(), api.getPostLog()])
      .then(([s, h, p]) => {
        setSprint(s);
        setHistory(h);
        setPostLog(p);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !sprint) {
    return <div className="text-graphite-400 text-sm p-8">Loading mission control...</div>;
  }

  const latest = history[history.length - 1];
  const current = { linkedin: latest?.linkedin ?? STARTING.linkedin, instagram: latest?.instagram ?? STARTING.instagram };

  const expectedLinkedin = expectedFollowers("linkedin", sprint.week);
  const expectedInstagram = expectedFollowers("instagram", sprint.week);
  const paceLinkedin = computePace(current.linkedin, expectedLinkedin);
  const paceInstagram = computePace(current.instagram, expectedInstagram);

  return (
    <div className="flex flex-col gap-6">
      <div className="console-panel p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-graphite-400 mb-1">Sprint Progress</p>
          <p className="font-metric text-2xl font-bold">
            Day {sprint.day} <span className="text-graphite-500 text-base">of 90</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-graphite-400 mb-1">Days Remaining</p>
          <p className="font-metric text-2xl font-bold" style={{ color: "var(--color-linkedin-400)" }}>
            {sprint.daysRemaining}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-graphite-400 mb-1">Sprint Start</p>
          <p className="font-metric text-sm text-graphite-300">{sprint.sprintStart}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Gauge
          platform="linkedin"
          current={current.linkedin}
          target={TARGETS.linkedin}
          starting={STARTING.linkedin}
          pace={paceLinkedin}
          weekOfSprint={sprint.week}
        />
        <Gauge
          platform="instagram"
          current={current.instagram}
          target={TARGETS.instagram}
          starting={STARTING.instagram}
          pace={paceInstagram}
          weekOfSprint={sprint.week}
          realityCheck="Going from 10 to 5,000 followers in 12 weeks on a cold-start account is an extremely aggressive target. Treat it as a stretch goal driven by consistent Reels output, not a guaranteed outcome."
        />
      </div>

      <Heatmap sprintStart={sprint.sprintStart} postLog={postLog} />
    </div>
  );
}
