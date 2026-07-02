import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../lib/api";
import { MILESTONES, type HistoryEntry } from "../data/types";
import { dayOfSprint, todayISO } from "../lib/sprint";
import { showToast } from "../lib/toast";

function emptyForm() {
  return {
    date: todayISO(),
    linkedin: "",
    instagram: "",
    notes: "",
    liLikes: "",
    liComments: "",
    liShares: "",
    igLikes: "",
    igComments: "",
    igShares: "",
  };
}

export function GrowthLedger() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [sprintStart, setSprintStart] = useState<string>(todayISO());
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([api.getHistory(), api.getSprint()])
      .then(([h, s]) => {
        setHistory(h);
        setSprintStart(s.sprintStart);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const historyChart = useMemo(
    () =>
      history.map((h) => ({
        day: dayOfSprint(sprintStart, h.date) - 1,
        date: h.date,
        linkedin: h.linkedin,
        instagram: h.instagram,
      })),
    [history, sprintStart],
  );

  const milestoneChart = useMemo(
    () =>
      MILESTONES.map((m) => ({
        day: m.week * 7,
        linkedin: m.linkedin,
        instagram: m.instagram,
      })),
    [],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const li = Number(form.linkedin);
    const ig = Number(form.instagram);
    if (!form.date || Number.isNaN(li) || Number.isNaN(ig)) {
      setError("Date, LinkedIn and Instagram counts are required.");
      return;
    }
    const engagement: HistoryEntry["engagement"] = {};
    if (form.liLikes || form.liComments || form.liShares) {
      engagement.linkedin = {
        likes: Number(form.liLikes) || 0,
        comments: Number(form.liComments) || 0,
        shares: Number(form.liShares) || 0,
      };
    }
    if (form.igLikes || form.igComments || form.igShares) {
      engagement.instagram = {
        likes: Number(form.igLikes) || 0,
        comments: Number(form.igComments) || 0,
        shares: Number(form.igShares) || 0,
      };
    }
    const payload = { date: form.date, linkedin: li, instagram: ig, notes: form.notes, engagement };

    try {
      if (editingId) {
        await api.updateHistory(editingId, payload);
        showToast("Entry updated");
      } else {
        await api.addHistory(payload);
        showToast("Entry added to the ledger");
      }
      setForm(emptyForm());
      setEditingId(null);
      load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save entry";
      setError(message);
      showToast(message, "error");
    }
  }

  function startEdit(h: HistoryEntry) {
    setEditingId(h.id);
    setForm({
      date: h.date,
      linkedin: String(h.linkedin),
      instagram: String(h.instagram),
      notes: h.notes ?? "",
      liLikes: String(h.engagement?.linkedin?.likes ?? ""),
      liComments: String(h.engagement?.linkedin?.comments ?? ""),
      liShares: String(h.engagement?.linkedin?.shares ?? ""),
      igLikes: String(h.engagement?.instagram?.likes ?? ""),
      igComments: String(h.engagement?.instagram?.comments ?? ""),
      igShares: String(h.engagement?.instagram?.shares ?? ""),
    });
  }

  async function handleDelete(id: string, date: string) {
    if (!window.confirm(`Delete the entry from ${date}? This can't be undone.`)) return;
    await api.deleteHistory(id);
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyForm());
    }
    showToast("Entry deleted", "info");
    load();
  }

  if (loading) return <div className="text-graphite-400 text-sm p-8">Loading growth ledger...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="console-panel p-5">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-graphite-300 mb-4">
          Follower Trend vs. Target Pace
        </h3>
        <ResponsiveContainer width="100%" height={340}>
          <LineChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-graphite-750)" />
            <XAxis
              dataKey="day"
              type="number" min="0"
              domain={[0, 90]}
              stroke="var(--color-graphite-400)"
              tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
              label={{ value: "Sprint day", position: "insideBottom", offset: -3, fill: "var(--color-graphite-500)", fontSize: 11 }}
            />
            <YAxis
              yAxisId="linkedin"
              stroke="var(--color-linkedin-400)"
              tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
            />
            <YAxis
              yAxisId="instagram"
              orientation="right"
              stroke="var(--color-instagram-400)"
              tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
            />
            <Tooltip
              contentStyle={{ background: "var(--color-graphite-850)", border: "1px solid var(--color-graphite-700)", borderRadius: 8 }}
              labelStyle={{ color: "var(--color-graphite-300)" }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              yAxisId="linkedin"
              data={historyChart}
              dataKey="linkedin"
              name="LinkedIn"
              stroke="var(--color-linkedin-500)"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
            <Line
              yAxisId="linkedin"
              data={milestoneChart}
              dataKey="linkedin"
              name="LinkedIn Target"
              stroke="var(--color-linkedin-400)"
              strokeDasharray="6 4"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              yAxisId="instagram"
              data={historyChart}
              dataKey="instagram"
              name="Instagram"
              stroke="var(--color-instagram-500)"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
            <Line
              yAxisId="instagram"
              data={milestoneChart}
              dataKey="instagram"
              name="Instagram Target"
              stroke="var(--color-instagram-400)"
              strokeDasharray="6 4"
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <form onSubmit={handleSubmit} className="console-panel p-5 flex flex-col gap-4">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-graphite-300">
          {editingId ? "Edit Entry" : "Log Today's Numbers"}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="Date">
            <input
              type="date"
              value={form.date}
              max={todayISO()}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="LinkedIn followers">
            <input
              type="number" min="0"
              value={form.linkedin}
              onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
              className="input font-metric"
              placeholder="7000"
            />
          </Field>
          <Field label="Instagram followers">
            <input
              type="number" min="0"
              value={form.instagram}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              className="input font-metric"
              placeholder="10"
            />
          </Field>
          <Field label="Notes">
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input"
              placeholder="optional"
            />
          </Field>
        </div>

        <details className="text-sm">
          <summary className="cursor-pointer text-graphite-400 hover:text-graphite-200">
            Best post this week — engagement (optional)
          </summary>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
            <fieldset className="contents">
              <legend className="sr-only">LinkedIn engagement</legend>
              <Field label="LI likes">
                <input type="number" min="0" value={form.liLikes} onChange={(e) => setForm({ ...form, liLikes: e.target.value })} className="input font-metric" />
              </Field>
              <Field label="LI comments">
                <input type="number" min="0" value={form.liComments} onChange={(e) => setForm({ ...form, liComments: e.target.value })} className="input font-metric" />
              </Field>
              <Field label="LI shares">
                <input type="number" min="0" value={form.liShares} onChange={(e) => setForm({ ...form, liShares: e.target.value })} className="input font-metric" />
              </Field>
              <Field label="IG likes">
                <input type="number" min="0" value={form.igLikes} onChange={(e) => setForm({ ...form, igLikes: e.target.value })} className="input font-metric" />
              </Field>
              <Field label="IG comments">
                <input type="number" min="0" value={form.igComments} onChange={(e) => setForm({ ...form, igComments: e.target.value })} className="input font-metric" />
              </Field>
              <Field label="IG shares">
                <input type="number" min="0" value={form.igShares} onChange={(e) => setForm({ ...form, igShares: e.target.value })} className="input font-metric" />
              </Field>
            </fieldset>
          </div>
        </details>

        {error && <p className="text-sm" style={{ color: "var(--color-signal-bad)" }}>{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-linkedin-500 text-white hover:opacity-90 transition"
          >
            {editingId ? "Save Changes" : "Add Entry"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm());
              }}
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-graphite-700 text-graphite-300 hover:bg-graphite-800 transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="console-panel p-5 overflow-x-auto">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-graphite-300 mb-4">History</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-graphite-400 border-b border-graphite-750">
              <th className="py-2 pr-4 font-medium">Date</th>
              <th className="py-2 pr-4 font-medium">LinkedIn</th>
              <th className="py-2 pr-4 font-medium">Instagram</th>
              <th className="py-2 pr-4 font-medium">Notes</th>
              <th className="py-2 pr-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-graphite-500">
                  No entries yet — log today's numbers above to start the trend line.
                </td>
              </tr>
            )}
            {[...history].reverse().map((h) => {
              const isToday = h.date === todayISO();
              const isEditing = h.id === editingId;
              return (
                <tr
                  key={h.id}
                  className="border-b border-graphite-800/60 hover:bg-graphite-800/40"
                  style={isEditing ? { backgroundColor: "rgba(47, 129, 247, 0.08)" } : undefined}
                >
                  <td className="py-2 pr-4 font-metric text-graphite-300">
                    {h.date}
                    {isToday && (
                      <span
                        className="ml-2 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                        style={{ color: "var(--color-linkedin-400)", border: "1px solid var(--color-linkedin-600)" }}
                      >
                        Today
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-4 font-metric" style={{ color: "var(--color-linkedin-400)" }}>
                    {h.linkedin.toLocaleString()}
                  </td>
                  <td className="py-2 pr-4 font-metric" style={{ color: "var(--color-instagram-400)" }}>
                    {h.instagram.toLocaleString()}
                  </td>
                  <td className="py-2 pr-4 text-graphite-400">{h.notes}</td>
                  <td className="py-2 pr-4 text-right whitespace-nowrap">
                    <button onClick={() => startEdit(h)} className="text-xs text-graphite-400 hover:text-graphite-100 mr-3">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(h.id, h.date)} className="text-xs text-graphite-400 hover:text-signal-bad">
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-graphite-400">
      {label}
      {children}
    </label>
  );
}
