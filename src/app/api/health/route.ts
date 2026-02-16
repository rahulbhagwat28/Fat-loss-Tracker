import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 30, 500);
    const logs = await prisma.healthLog.findMany({
      where: { userId: session.id },
      orderBy: { logDate: "desc" },
      take: limit,
    });
    return NextResponse.json(logs);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const {
      logDate,
      weight,
      calories,
      protein,
      carbs,
      fat,
      sleepHours,
      energyLevel,
      steps,
    } = body;

    if (!logDate || typeof logDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(logDate)) {
      return NextResponse.json(
        { error: "logDate required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const data: {
      weight?: number;
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
      sleepHours?: number;
      energyLevel?: number;
      steps?: number;
    } = {};
    if (weight != null && weight !== "") data.weight = Number(weight);
    if (calories != null && calories !== "") data.calories = Number(calories);
    if (protein != null && protein !== "") data.protein = Number(protein);
    if (carbs != null && carbs !== "") data.carbs = Number(carbs);
    if (fat != null && fat !== "") data.fat = Number(fat);
    if (sleepHours != null && sleepHours !== "") data.sleepHours = Number(sleepHours);
    if (energyLevel != null && energyLevel !== "") {
      const level = Number(energyLevel);
      if (level >= 1 && level <= 10) data.energyLevel = level;
    }
    if (steps != null && steps !== "") data.steps = Number(steps);

    const log = await prisma.healthLog.upsert({
      where: {
        userId_logDate: { userId: session.id, logDate },
      },
      create: {
        userId: session.id,
        logDate,
        ...data,
      },
      update: data,
    });
    return NextResponse.json(log);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save log" }, { status: 500 });
  }
}
