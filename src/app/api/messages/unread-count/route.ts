import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireAuth();
    const count = await prisma.message.count({
      where: { receiverId: session.id, read: false },
    });
    return NextResponse.json({ count });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch unread count" }, { status: 500 });
  }
}
