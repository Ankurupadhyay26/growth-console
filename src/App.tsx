import { useEffect, useState } from "react";
import { MissionControl } from "./tabs/MissionControl";
import { GrowthLedger } from "./tabs/GrowthLedger";
import { ContentFeed } from "./tabs/ContentFeed";
import { Playbook } from "./tabs/Playbook";
import { api, type SprintInfo } from "./lib/api";
import { ToastHost } from "./components/ToastHost";
import { showToast } from "./lib/toast";

type TabId = "mission-control" | "growth-ledger" | "content-feed" | "playbook";

const TABS: { id: TabId; label: string }[] = [
  { id: "mission-control", label: "Mission Control" },
  { id: "growth-ledger", label: "Growth Ledger" },
  { id: "content-feed", label: "Content Feed" },
  { id: "playbook", label: "Playbook" },
];

function App() {
  const [tab, setTab] = useState<TabId>("mission-control");
  const [sprint, setSprint] = useState<SprintInfo | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    api.getSprint().then(setSprint).catch(() => {});
  }, [refreshKey]);

  function handleRefresh() {
    setRefreshKey((k) => k + 1);
    showToast("Dashboard refreshed", "info");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-graphite-800 bg-graphite-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: "linear-gradient(135deg, var(--color-linkedin-500), var(--color-instagram-500))" }}
            />
            <h1 className="text-lg font-semibold tracking-tight">
              Growth Console
            </h1>
            <span className="text-xs font-metric text-graphite-500 hidden sm:inline">
              {sprint ? `Day ${sprint.day} / 90` : ""}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <nav className="flex gap-1 rounded-lg border border-graphite-800 p-1 bg-graphite-950/60">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    tab === t.id
                      ? "bg-graphite-750 text-graphite-100"
                      : "text-graphite-400 hover:text-graphite-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
            <button
              onClick={handleRefresh}
              title="Refresh data from disk"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium border border-graphite-800 text-graphite-400 hover:text-graphite-100 hover:bg-graphite-800 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                <path d="M21 3v6h-6" />
              </svg>
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        {tab === "mission-control" && <MissionControl key={`mc-${refreshKey}`} />}
        {tab === "growth-ledger" && <GrowthLedger key={`gl-${refreshKey}`} />}
        {tab === "content-feed" && <ContentFeed key={`cf-${refreshKey}`} />}
        {tab === "playbook" && <Playbook />}
      </main>

      <footer className="text-center text-[11px] text-graphite-600 py-4">
        Growth Console · local-only · data.json on disk
      </footer>

      <ToastHost />
    </div>
  );
}

export default App;
