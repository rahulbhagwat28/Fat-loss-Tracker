import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// Search other users by username (name) or email.
export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
      return NextResponse.json([]);
    }
    const users = await prisma.user.findMany({
      where: {
        id: { not: session.id },
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
        ],
      },
      select: { id: true, name: true, avatarUrl: true },
      take: 20,
    });
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ user1Id: session.id }, { user2Id: session.id }],
      },
    });
    const friendIds = new Set(
      friendships.flatMap((f) => (f.user1Id === session.id ? f.user2Id : f.user1Id))
    );
    const pendingFrom = await prisma.friendRequest.findMany({
      where: { fromId: session.id, status: "pending" },
      select: { id: true, toId: true },
    });
    const pendingTo = new Set(pendingFrom.map((r) => r.toId));
    const sentRequestIdByToId = new Map(pendingFrom.map((r) => [r.toId, r.id]));
    const list = users.map((u) => ({
      ...u,
      isFriend: friendIds.has(u.id),
      pendingRequest: pendingTo.has(u.id),
      sentRequestId: sentRequestIdByToId.get(u.id) ?? null,
    }));
    return NextResponse.json(list);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
