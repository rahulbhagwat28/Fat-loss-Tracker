import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireAuth();
    const requests = await prisma.friendRequest.findMany({
      where: { toId: session.id, status: "pending" },
      include: {
        from: { select: { id: true, name: true, avatarUrl: true, email: true } },
      },
    });
    return NextResponse.json(requests);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

// Validations: no self-request, no duplicate pending, no request to existing friend.
// Statuses: PENDING | ACCEPTED | REJECTED | CANCELLED (stored lowercase).
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const { toId } = await request.json();
    if (!toId) {
      return NextResponse.json({ error: "toId required" }, { status: 400 });
    }
    if (toId === session.id) {
      return NextResponse.json({ error: "Cannot send request to yourself" }, { status: 400 });
    }
    const existing = await prisma.friendRequest.findUnique({
      where: { fromId_toId: { fromId: session.id, toId } },
    });
    if (existing) {
      if (existing.status === "pending") {
        return NextResponse.json({ error: "Request already sent" }, { status: 400 });
      }
      if (existing.status === "accepted") {
        return NextResponse.json({ error: "Already friends" }, { status: 400 });
      }
      if (existing.status === "rejected" || existing.status === "cancelled") {
        await prisma.friendRequest.update({
          where: { id: existing.id },
          data: { status: "pending" },
        });
        await prisma.notification.create({
          data: {
            userId: toId,
            type: "friend_request",
            actorId: session.id,
            refId: existing.id,
          },
        });
        return NextResponse.json({ ok: true, requestId: existing.id });
      }
      return NextResponse.json({ error: "Already handled" }, { status: 400 });
    }
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: session.id, user2Id: toId },
          { user1Id: toId, user2Id: session.id },
        ],
      },
    });
    if (friendship) {
      return NextResponse.json({ error: "Already friends" }, { status: 400 });
    }
    const fr = await prisma.friendRequest.create({
      data: { fromId: session.id, toId },
    });
    await prisma.notification.create({
      data: {
        userId: toId,
        type: "friend_request",
        actorId: session.id,
        refId: fr.id,
      },
    });
    return NextResponse.json({ ok: true, requestId: fr.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to send request" }, { status: 500 });
  }
}
