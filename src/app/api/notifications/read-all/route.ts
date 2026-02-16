import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST() {
  try {
    const session = await requireAuth();
    await prisma.notification.updateMany({
      where: { userId: session.id },
      data: { read: true },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to mark all read" }, { status: 500 });
  }
}
