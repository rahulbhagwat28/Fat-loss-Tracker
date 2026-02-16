"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type HealthLog = {
  id: string;
  logDate: string;
  weight: number | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  sleepHours: number | null;
  energyLevel: number | null;
  steps: number | null;
  updatedAt: string;
};

const today = () => new Date().toISOString().slice(0, 10);

export default function HealthPage() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logDate, setLogDate] = useState(() => {
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) return dateParam;
    return today();
  });
  const [weight, setWeight] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [energyLevel, setEnergyLevel] = useState("");
  const [steps, setSteps] = useState("");
  const [message, setMessage] = useState("");

  const fetchLogs = async () => {
    const res = await fetch("/api/health?limit=30");
    if (res.ok) {
      const data = await res.json();
      setLogs(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) return;
    setLogDate(dateParam);
    fetch("/api/health?limit=90")
      .then((r) => r.json())
      .then((data: HealthLog[]) => {
        const log = data.find((l) => l.logDate === dateParam);
        if (log) {
          setWeight(log.weight != null ? String(log.weight) : "");
          setCalories(log.calories != null ? String(log.calories) : "");
          setProtein(log.protein != null ? String(log.protein) : "");
          setCarbs(log.carbs != null ? String(log.carbs) : "");
          setFat(log.fat != null ? String(log.fat) : "");
          setSleepHours(log.sleepHours != null ? String(log.sleepHours) : "");
          setEnergyLevel(log.energyLevel != null ? String(log.energyLevel) : "");
          setSteps(log.steps != null ? String(log.steps) : "");
        }
      });
  }, [dateParam]);

  const loadLogIntoForm = (log: HealthLog) => {
    setLogDate(log.logDate);
    setWeight(log.weight != null ? String(log.weight) : "");
    setCalories(log.calories != null ? String(log.calories) : "");
    setProtein(log.protein != null ? String(log.protein) : "");
    setCarbs(log.carbs != null ? String(log.carbs) : "");
    setFat(log.fat != null ? String(log.fat) : "");
    setSleepHours(log.sleepHours != null ? String(log.sleepHours) : "");
    setEnergyLevel(log.energyLevel != null ? String(log.energyLevel) : "");
    setSteps(log.steps != null ? String(log.steps) : "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setSaving(true);
    try {
      const res = await fetch("/api/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logDate,
          weight: weight || undefined,
          calories: calories || undefined,
          protein: protein || undefined,
          carbs: carbs || undefined,
          fat: fat || undefined,
          sleepHours: sleepHours || undefined,
          energyLevel: energyLevel || undefined,
          steps: steps || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setLogs((prev) => {
        const rest = prev.filter((l) => l.logDate !== data.logDate);
        return [data, ...rest];
      });
      setMessage("Saved!");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    const res = await fetch(`/api/health/${id}`, { method: "DELETE" });
    if (res.ok) setLogs((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <div>
      <h1 className="font-display text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
        Add Log
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-surface-card border border-surface-border rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8"
      >
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-400 mb-1">Date</label>
          <input
            type="date"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-surface-dark border border-surface-border text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Weight (lbs)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 160"
              className="w-full px-4 py-2 rounded-xl bg-surface-dark border border-surface-border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Calories
            </label>
            <input
              type="number"
              min="0"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="e.g. 2000"
              className="w-full px-4 py-2 rounded-xl bg-surface-dark border border-surface-border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Sleep (hours)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
              placeholder="e.g. 7.5"
              className="w-full px-4 py-2 rounded-xl bg-surface-dark border border-surface-border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Steps
            </label>
            <input
              type="number"
              min="0"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder="e.g. 10000"
              className="w-full px-4 py-2 rounded-xl bg-surface-dark border border-surface-border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium text-slate-400 mb-2">Macros (grams)</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Protein</label>
              <input
                type="number"
                min="0"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="g"
                className="w-full px-4 py-2 rounded-xl bg-surface-dark border border-surface-border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Carbs</label>
              <input
                type="number"
                min="0"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="g"
                className="w-full px-4 py-2 rounded-xl bg-surface-dark border border-surface-border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Fat</label>
              <input
                type="number"
                min="0"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                placeholder="g"
                className="w-full px-4 py-2 rounded-xl bg-surface-dark border border-surface-border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-400 mb-2">
            Energy level (1–10)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="1"
              max="10"
              value={energyLevel || "5"}
              onChange={(e) => setEnergyLevel(e.target.value)}
              className="flex-1 h-2 rounded-lg appearance-none bg-surface-dark accent-brand-500"
            />
            <span className="text-white font-medium w-8">{energyLevel || "–"}</span>
          </div>
        </div>

        {message && (
          <p
            className={`mb-4 text-sm ${
              message === "Saved!" ? "text-green-400" : "text-red-400"
            }`}
          >
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save entry"}
        </button>
      </form>

      <section>
        <h2 className="text-lg font-semibold text-white mb-3">Recent entries</h2>
        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-slate-500">No entries yet. Add one above.</p>
        ) : (
          <ul className="space-y-2">
            {logs.map((log) => (
              <li
                key={log.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4 bg-surface-card border border-surface-border rounded-xl"
              >
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="font-medium text-white">
                    {new Date(log.logDate + "T12:00:00").toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  {log.weight != null && (
                    <span className="text-slate-400">{log.weight} lbs</span>
                  )}
                  {log.calories != null && (
                    <span className="text-slate-400">{log.calories} cal</span>
                  )}
                  {(log.protein != null || log.carbs != null || log.fat != null) && (
                    <span className="text-slate-400">
                      P {log.protein ?? "–"} / C {log.carbs ?? "–"} / F {log.fat ?? "–"} g
                    </span>
                  )}
                  {log.sleepHours != null && (
                    <span className="text-slate-400">{log.sleepHours}h sleep</span>
                  )}
                  {log.energyLevel != null && (
                    <span className="text-slate-400">Energy: {log.energyLevel}/10</span>
                  )}
                  {log.steps != null && (
                    <span className="text-slate-400">{log.steps.toLocaleString()} steps</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => loadLogIntoForm(log)}
                    className="px-3 py-1.5 rounded-lg bg-surface-dark border border-surface-border text-slate-300 hover:text-white text-sm"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(log.id)}
                    className="px-3 py-1.5 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/20 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
