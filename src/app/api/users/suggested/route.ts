import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireAuth();
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ user1Id: session.id }, { user2Id: session.id }],
      },
    });
    const friendIds = new Set(
      friendships.flatMap((f) => (f.user1Id === session.id ? f.user2Id : f.user1Id))
    );
    const pendingSent = await prisma.friendRequest.findMany({
      where: { fromId: session.id, status: "pending" },
      select: { toId: true },
    });
    const pendingToIds = new Set(pendingSent.map((r) => r.toId));
    const excludeIds = new Set([
      session.id,
      ...Array.from(friendIds),
      ...Array.from(pendingToIds),
    ]);

    const users = await prisma.user.findMany({
      where: { id: { notIn: Array.from(excludeIds) } },
      select: { id: true, name: true, avatarUrl: true },
      orderBy: { createdAt: "desc" },
      take: 24,
    });

    const list = users.map((u) => ({
      ...u,
      isFriend: false,
      pendingRequest: false,
    }));
    return NextResponse.json(list);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
