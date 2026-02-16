import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const withUserId = searchParams.get("with");
    if (!withUserId) {
      return NextResponse.json({ error: "with (user id) required" }, { status: 400 });
    }
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.id, receiverId: withUserId },
          { senderId: withUserId, receiverId: session.id },
        ],
      },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    await prisma.message.updateMany({
      where: { receiverId: session.id, senderId: withUserId, read: false },
      data: { read: true },
    });
    return NextResponse.json(messages);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth(request);
    const { text, receiverId } = await request.json();
    if (!text?.trim() || !receiverId) {
      return NextResponse.json(
        { error: "text and receiverId required" },
        { status: 400 }
      );
    }
    const message = await prisma.message.create({
      data: {
        text: text.trim(),
        senderId: session.id,
        receiverId,
      },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
        receiver: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: "message",
        actorId: session.id,
        refId: message.id,
      },
    });
    return NextResponse.json(message);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";
    if (all) {
      await prisma.message.deleteMany({
        where: {
          OR: [
            { senderId: session.id },
            { receiverId: session.id },
          ],
        },
      });
      return NextResponse.json({ ok: true });
    }
    const withUserId = searchParams.get("with");
    if (!withUserId) {
      return NextResponse.json({ error: "with (user id) required" }, { status: 400 });
    }
    if (withUserId === session.id) {
      return NextResponse.json({ error: "Cannot clear chat with yourself" }, { status: 400 });
    }
    await prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: session.id, receiverId: withUserId },
          { senderId: withUserId, receiverId: session.id },
        ],
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to clear chat" }, { status: 500 });
  }
}
