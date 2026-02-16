import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireAuth();
    const { userId: otherId } = await params;
    if (otherId === session.id) {
      return NextResponse.json({ error: "Cannot unfriend yourself" }, { status: 400 });
    }
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: session.id, user2Id: otherId },
          { user1Id: otherId, user2Id: session.id },
        ],
      },
    });
    if (!friendship) {
      return NextResponse.json({ error: "Not friends" }, { status: 400 });
    }
    await prisma.friendship.delete({
      where: { id: friendship.id },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to unfriend" }, { status: 500 });
  }
}
