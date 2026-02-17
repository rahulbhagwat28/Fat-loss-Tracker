import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);
    const count = await prisma.notification.count({
      where: { userId: session.id, read: false },
    });
    return NextResponse.json({ count });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch count" }, { status: 500 });
  }
}
