"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const PER_PAGE = 25;

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

export default function HistoryPage() {
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchLogs = async () => {
    const res = await fetch("/api/health?limit=500");
    if (res.ok) {
      const data = await res.json();
      setLogs(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const totalPages = Math.max(1, Math.ceil(logs.length / PER_PAGE));
  const start = (page - 1) * PER_PAGE;
  const paginatedLogs = logs.slice(start, start + PER_PAGE);

  useEffect(() => {
    if (page > totalPages && totalPages > 0) setPage(totalPages);
  }, [page, totalPages]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    const res = await fetch(`/api/health/${id}`, { method: "DELETE" });
    if (res.ok) {
      setLogs((prev) => {
        const next = prev.filter((l) => l.id !== id);
        const newTotalPages = Math.max(1, Math.ceil(next.length / PER_PAGE));
        if (page > newTotalPages) setPage(newTotalPages);
        return next;
      });
    }
  };

  const formatDate = (logDate: string) =>
    new Date(logDate + "T12:00:00").toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white mb-6 whitespace-nowrap">
        History
      </h1>

      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="mb-4">No log entries yet.</p>
          <Link
            href="/health"
            className="text-brand-400 hover:underline font-medium"
          >
            Add your first log
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {paginatedLogs.map((log) => (
              <div
                key={log.id}
                className="bg-surface-card border border-surface-border rounded-xl p-3.5 hover:border-brand-500/40 transition min-w-0"
              >
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <h2 className="font-semibold text-white text-sm truncate min-w-0">
                    {formatDate(log.logDate)}
                  </h2>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <Link
                      href={`/health?date=${log.logDate}`}
                      className="px-2 py-1 rounded-md bg-surface-dark border border-surface-border text-slate-300 hover:text-white hover:border-brand-500/50 text-xs font-medium transition"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(log.id)}
                      className="px-2 py-1 rounded-md border border-red-500/50 text-red-400 hover:bg-red-500/20 text-xs font-medium transition"
                    >
                      Del
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm text-slate-300">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 shrink-0">Date</span>
                    <span>{formatDate(log.logDate)}</span>
                  </div>
                  {log.weight != null && (
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500 shrink-0">Weight</span>
                      <span className="tabular-nums">{log.weight} lbs</span>
                    </div>
                  )}
                  {log.calories != null && (
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500 shrink-0">Calories</span>
                      <span className="tabular-nums">{log.calories}</span>
                    </div>
                  )}
                  {(log.protein != null || log.carbs != null || log.fat != null) && (
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500 shrink-0">Macros</span>
                      <span className="tabular-nums text-right">
                        P{log.protein ?? "–"} C{log.carbs ?? "–"} F{log.fat ?? "–"}g
                      </span>
                    </div>
                  )}
                  {log.sleepHours != null && (
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500 shrink-0">Sleep</span>
                      <span className="tabular-nums">{log.sleepHours}h</span>
                    </div>
                  )}
                  {log.energyLevel != null && (
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500 shrink-0">Energy</span>
                      <span className="tabular-nums">{log.energyLevel}/10</span>
                    </div>
                  )}
                  {log.steps != null && (
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500 shrink-0">Steps</span>
                      <span className="tabular-nums">{log.steps.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {log.weight == null &&
                  log.calories == null &&
                  log.protein == null &&
                  log.carbs == null &&
                  log.fat == null &&
                  log.sleepHours == null &&
                  log.energyLevel == null &&
                  log.steps == null && (
                    <p className="text-slate-500 text-xs italic mt-1.5">No data</p>
                  )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-sm text-slate-400">
              Showing {start + 1}–{start + paginatedLogs.length} of {logs.length} entries (25 per page)
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg bg-surface-card border border-surface-border text-slate-300 hover:text-white hover:border-brand-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-white font-medium bg-surface-card border border-surface-border rounded-lg min-w-[7rem] text-center">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-lg bg-surface-card border border-surface-border text-slate-300 hover:text-white hover:border-brand-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
