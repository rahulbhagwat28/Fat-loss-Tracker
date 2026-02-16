import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function PATCH(request: Request) {
  try {
    const session = await requireAuth();
    const { avatarUrl } = await request.json();
    if (!avatarUrl) {
      return NextResponse.json({ error: "avatarUrl required" }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: session.id },
      data: { avatarUrl },
    });
    return NextResponse.json({ avatarUrl });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
