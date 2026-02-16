import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireAuth();
    const sent = await prisma.message.findMany({
      where: { senderId: session.id },
      distinct: ["receiverId"],
      orderBy: { createdAt: "desc" },
      include: {
        receiver: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    const received = await prisma.message.findMany({
      where: { receiverId: session.id },
      distinct: ["senderId"],
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    const map = new Map<
      string,
      { user: { id: string; name: string; avatarUrl: string | null }; lastAt: Date; lastText: string }
    >();
    for (const m of sent) {
      map.set(m.receiverId, {
        user: m.receiver,
        lastAt: m.createdAt,
        lastText: m.text,
      });
    }
    for (const m of received) {
      const existing = map.get(m.senderId);
      if (!existing || m.createdAt > existing.lastAt) {
        map.set(m.senderId, {
          user: m.sender,
          lastAt: m.createdAt,
          lastText: m.text,
        });
      }
    }
    const list = Array.from(map.entries()).map(([id, v]) => ({
      userId: id,
      ...v,
    }));
    list.sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
    return NextResponse.json(list);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}
