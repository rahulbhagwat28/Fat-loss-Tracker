import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireAuth();
    const notifications = await prisma.notification.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        actor: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    const unreadCount = await prisma.notification.count({
      where: { userId: session.id, read: false },
    });
    return NextResponse.json({ notifications, unreadCount });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
