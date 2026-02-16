import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: postId } = await params;
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true },
    });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (post.userId !== session.id) {
      return NextResponse.json({ error: "You can only delete your own posts" }, { status: 403 });
    }
    await prisma.post.delete({
      where: { id: postId },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
