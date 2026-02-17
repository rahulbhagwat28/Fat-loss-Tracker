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

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, userId: true },
    });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId: session.id, postId } },
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      return NextResponse.json({ liked: false });
    }

    const like = await prisma.like.create({
      data: { userId: session.id, postId },
    });

    if (post.userId !== session.id) {
      await prisma.notification.create({
        data: {
          userId: post.userId,
          type: "like",
          actorId: session.id,
          refId: like.id,
          postId: post.id,
        },
      });
      sendPushToUser(post.userId, "like", session.name, { postId: post.id, refId: like.id }).catch(() => {});
    }

    return NextResponse.json({ liked: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to like" }, { status: 500 });
  }
}
