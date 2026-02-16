import { useEffect, useState, useMemo } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Dimensions } from "react-native";
import Svg, { Path, Circle, Line, Text as SvgText } from "react-native-svg";
import { apiJson } from "../../../src/api";
import type { HealthLog } from "../../../src/types";
import { theme } from "../../../src/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = Math.max(320, SCREEN_WIDTH - 32);
const CHART_HEIGHT = 240;
const PADDING = { top: 20, right: 24, bottom: 32, left: 48 };

type DataPoint = { date: string; weight: number; displayDate: string };

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

export default function WeightGraphScreen() {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiJson<HealthLog[]>("/api/health?limit=500")
      .then((logs) => {
        const withWeight = (Array.isArray(logs) ? logs : [])
          .filter((l) => l.weight != null && Number(l.weight) > 0)
          .map((l) => {
            const w = Number(l.weight);
            return {
              date: l.logDate,
              weight: w,
              displayDate: new Date(l.logDate + "T12:00:00").toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "2-digit",
              }),
            };
          })
          .sort((a, b) => a.date.localeCompare(b.date));
        setData(withWeight);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  const innerW = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerH = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const { path, minW, maxW, xScale, yTicks } = useMemo(() => {
    if (data.length === 0) return { path: "", minW: 0, maxW: 100, xScale: 0, yTicks: [] as number[] };
    const weights = data.map((d) => d.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const range = maxWeight - minWeight || 1;
    const paddedMin = minWeight - range * 0.05;
    const paddedMax = maxWeight + range * 0.05;
    const step = (paddedMax - paddedMin) / 4;
    const ticks: number[] = [];
    for (let i = 0; i <= 4; i++) ticks.push(paddedMin + step * i);
    return {
      path: buildPath(data, paddedMin, paddedMax, innerW, innerH),
      minW: paddedMin,
      maxW: paddedMax,
      xScale: innerW / Math.max(1, data.length - 1),
      yTicks: ticks,
    };
  }, [data, innerW, innerH]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#22c55e" size="large" />
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>No weight entries yet.</Text>
        <Text style={styles.hint}>Add weight in the Health tab to see your graph here.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.chartWrap}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
          {yTicks.map((tick, i) => {
            const y = PADDING.top + innerH - ((tick - minW) / (maxW - minW)) * innerH;
            return (
              <Line
                key={i}
                x1={PADDING.left}
                y1={y}
                x2={CHART_WIDTH - PADDING.right}
                y2={y}
                stroke={theme.border}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            );
          })}
          <Path d={path} fill="none" stroke={theme.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          {data.map((d, i) => {
            const x = PADDING.left + i * xScale;
            const y = PADDING.top + innerH - ((d.weight - minW) / (maxW - minW)) * innerH;
            return <Circle key={d.date} cx={x} cy={y} r={4} fill={theme.accent} />;
          })}
          {yTicks.map((tick, i) => {
            const y = PADDING.top + innerH - ((tick - minW) / (maxW - minW)) * innerH;
            return (
              <SvgText key={i} x={PADDING.left - 6} y={y + 4} fill={theme.muted} fontSize={11} textAnchor="end">
                {Math.round(tick)} lbs
              </SvgText>
            );
          })}
          <SvgText x={PADDING.left} y={CHART_HEIGHT - 8} fill={theme.muted} fontSize={11}>
            {data[0].displayDate}
          </SvgText>
          {data.length > 1 && (
            <SvgText x={CHART_WIDTH - PADDING.right} y={CHART_HEIGHT - 8} fill={theme.muted} fontSize={11} textAnchor="end">
              {data[data.length - 1].displayDate}
            </SvgText>
          )}
        </Svg>
        <Text style={styles.footer}>
          {data.length} weight entr{data.length === 1 ? "y" : "ies"} • oldest to newest
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  scroll: { padding: 16, paddingBottom: 40 },
  chartWrap: { backgroundColor: theme.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.border },
  muted: { color: theme.muted, textAlign: "center", marginBottom: 8 },
  hint: { color: theme.muted, textAlign: "center", fontSize: 13 },
  footer: { color: theme.muted, fontSize: 12, textAlign: "center", marginTop: 12 },
});
