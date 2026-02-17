import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push";

// Friend request statuses: PENDING | ACCEPTED | REJECTED | CANCELLED (stored lowercase)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await requireAuth();
    const { requestId } = await params;
    const { action } = await request.json(); // "accept" | "reject" (recipient) | "cancel" (sender)
    const fr = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });
    if (!fr) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const isSender = fr.fromId === session.id;
    const isRecipient = fr.toId === session.id;

    if (isSender && action === "cancel") {
      if (fr.status !== "pending") {
        return NextResponse.json({ error: "Only pending requests can be cancelled" }, { status: 400 });
      }
      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: "cancelled" },
      });
      return NextResponse.json({ ok: true });
    }

    if (isRecipient && fr.status === "pending") {
      if (action === "accept") {
        await prisma.$transaction([
          prisma.friendRequest.update({
            where: { id: requestId },
            data: { status: "accepted" },
          }),
          prisma.friendship.create({
            data: {
              user1Id: fr.fromId < fr.toId ? fr.fromId : fr.toId,
              user2Id: fr.fromId < fr.toId ? fr.toId : fr.fromId,
            },
          }),
        ]);
        await prisma.notification.create({
          data: {
            userId: fr.fromId,
            type: "friend_accepted",
            actorId: session.id,
            refId: requestId,
          },
        });
        sendPushToUser(fr.fromId, "friend_accepted", session.name, { refId: requestId }).catch(() => {});
        return NextResponse.json({ ok: true });
      }
      if (action === "reject") {
        await prisma.friendRequest.update({
          where: { id: requestId },
          data: { status: "rejected" },
        });
        return NextResponse.json({ ok: true });
      }
    }

    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}
