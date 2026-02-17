import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: postId } = await params;
    const { text } = await request.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: "Comment text required" }, { status: 400 });
    }
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true } });
    const comment = await prisma.comment.create({
      data: { userId: session.id, postId, text: text.trim() },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    if (post && post.userId !== session.id) {
      await prisma.notification.create({
        data: {
          userId: post.userId,
          type: "comment",
          actorId: session.id,
          refId: comment.id,
          postId,
        },
      });
      sendPushToUser(post.userId, "comment", session.name, { postId, refId: comment.id }).catch(() => {});
    }
    return NextResponse.json(comment);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
