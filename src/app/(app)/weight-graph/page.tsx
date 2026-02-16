"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

type HealthLog = {
  id: string;
  logDate: string;
  weight: number | null;
  createdAt: string;
};

type DataPoint = { date: string; weight: number; displayDate: string };

const CHART_WIDTH = 600;
const CHART_HEIGHT = 280;
const PADDING = { top: 20, right: 20, bottom: 36, left: 44 };

function buildPath(
  data: DataPoint[],
  minW: number,
  maxW: number,
  innerW: number,
  innerH: number
): string {
  if (data.length === 0) return "";
  const range = maxW - minW || 1;
  const xScale = innerW / Math.max(1, data.length - 1);
  const points = data.map((d, i) => {
    const x = PADDING.left + i * xScale;
    const y = PADDING.top + innerH - ((d.weight - minW) / range) * innerH;
    return `${x},${y}`;
  });
  return `M ${points.join(" L ")}`;
}

export default function WeightGraphPage() {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/health?limit=500")
      .then((res) => res.json())
      .then((logs: HealthLog[]) => {
        const withWeight = (Array.isArray(logs) ? logs : [])
          .filter((l) => l.weight != null && l.weight > 0)
          .map((l) => ({
            date: l.logDate,
            weight: l.weight as number,
            displayDate: new Date(l.logDate + "T12:00:00").toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "2-digit",
            }),
          }))
          .sort((a, b) => a.date.localeCompare(b.date));
        setData(withWeight);
      })
      .finally(() => setLoading(false));
  }, []);

  const innerW = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerH = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const { path, minW, maxW, xScale } = useMemo(() => {
    if (data.length === 0)
      return { path: "", minW: 0, maxW: 100, xScale: 0 };
    const weights = data.map((d) => d.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const range = maxWeight - minWeight || 1;
    const paddedMin = minWeight - range * 0.05;
    const paddedMax = maxWeight + range * 0.05;
    return {
      path: buildPath(data, paddedMin, paddedMax, innerW, innerH),
      minW: paddedMin,
      maxW: paddedMax,
      xScale: innerW / Math.max(1, data.length - 1),
    };
  }, [data, innerW, innerH]);

  const yTicks = useMemo(() => {
    if (data.length === 0) return [];
    const step = (maxW - minW) / 4;
    const ticks: number[] = [];
    for (let i = 0; i <= 4; i++) ticks.push(minW + step * i);
    return ticks;
  }, [minW, maxW, data.length]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white mb-6 whitespace-nowrap">
        Weight Graph
      </h1>

      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : data.length === 0 ? (
        <div className="bg-surface-card border border-surface-border rounded-2xl p-8 text-center">
          <p className="text-slate-400 mb-2">No weight entries yet.</p>
          <p className="text-sm text-slate-500">
            Add weight in the <Link href="/health" className="text-brand-400 hover:underline">Add Log</Link> tab to see your graph here.
          </p>
        </div>
      ) : (
        <div className="bg-surface-card border border-surface-border rounded-2xl p-4 sm:p-6 overflow-x-auto">
          <div className="relative min-w-[320px]" style={{ width: "100%", maxWidth: CHART_WIDTH }}>
            <svg
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              className="w-full h-auto"
              preserveAspectRatio="xMidYMid meet"
              onMouseLeave={() => setHoverIndex(null)}
            >
              {/* grid lines */}
              {yTicks.map((tick, i) => {
                const y = PADDING.top + (CHART_HEIGHT - PADDING.top - PADDING.bottom) * (1 - (tick - minW) / (maxW - minW));
                return (
                  <line
                    key={i}
                    x1={PADDING.left}
                    y1={y}
                    x2={CHART_WIDTH - PADDING.right}
                    y2={y}
                    stroke="#334155"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />
                );
              })}
              {/* line */}
              <path
                d={path}
                fill="none"
                stroke="#34d399"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* dots and hover areas */}
              {data.map((d, i) => {
                const x = PADDING.left + i * xScale;
                const y = PADDING.top + (CHART_HEIGHT - PADDING.top - PADDING.bottom) * (1 - (d.weight - minW) / (maxW - minW));
                const isHover = hoverIndex === i;
                return (
                  <g key={d.date}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isHover ? 6 : 4}
                      fill="#34d399"
                      stroke={isHover ? "#f0fdf4" : "transparent"}
                      strokeWidth={2}
                    />
                    <rect
                      x={x - 12}
                      y={0}
                      width={24}
                      height={CHART_HEIGHT}
                      fill="transparent"
                      onMouseEnter={() => setHoverIndex(i)}
                    />
                  </g>
                );
              })}
              {/* Y axis labels */}
              {yTicks.map((tick, i) => {
                const y = PADDING.top + (CHART_HEIGHT - PADDING.top - PADDING.bottom) * (1 - (tick - minW) / (maxW - minW));
                return (
                  <text
                    key={i}
                    x={PADDING.left - 6}
                    y={y + 4}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize={11}
                  >
                    {tick.toFixed(1)} lbs
                  </text>
                );
              })}
              {/* X axis labels - show a few */}
              {data.length > 0 && (
                <>
                  <text
                    x={PADDING.left}
                    y={CHART_HEIGHT - 8}
                    textAnchor="start"
                    fill="#94a3b8"
                    fontSize={11}
                  >
                    {data[0].displayDate}
                  </text>
                  {data.length > 1 && (
                    <text
                      x={CHART_WIDTH - PADDING.right}
                      y={CHART_HEIGHT - 8}
                      textAnchor="end"
                      fill="#94a3b8"
                      fontSize={11}
                    >
                      {data[data.length - 1].displayDate}
                    </text>
                  )}
                </>
              )}
            </svg>
            {/* tooltip when hovering */}
            {hoverIndex !== null && data[hoverIndex] && (
              <div
                className="absolute bg-surface-dark border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 shadow-lg pointer-events-none"
                style={{
                  left: "50%",
                  transform: "translateX(-50%)",
                  marginTop: -8,
                }}
              >
                <span className="text-slate-500">{data[hoverIndex].displayDate}</span>
                <span className="ml-2 font-medium text-brand-400">{data[hoverIndex].weight} lbs</span>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-3 text-center">
            {data.length} weight entr{data.length === 1 ? "y" : "ies"} • oldest to newest • hover for details
          </p>
        </div>
      )}
    </div>
  );
}
