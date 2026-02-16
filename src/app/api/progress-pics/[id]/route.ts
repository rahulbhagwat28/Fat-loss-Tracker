import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const pic = await prisma.progressPic.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!pic) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (pic.userId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await prisma.progressPic.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
