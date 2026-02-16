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
      include: {
        user1: { select: { id: true, name: true, avatarUrl: true } },
        user2: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    const friends = friendships.map((f) =>
      f.user1Id === session.id ? f.user2 : f.user1
    );
    return NextResponse.json(friends);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch friends" }, { status: 500 });
  }
}
