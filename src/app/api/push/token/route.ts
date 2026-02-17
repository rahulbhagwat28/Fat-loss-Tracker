import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

/** Register or update Expo push token for the current user. */
export async function POST(request: Request) {
  try {
    const session = await requireAuth(request);
    const { token } = await request.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "token required" }, { status: 400 });
    }
    await prisma.pushToken.upsert({
      where: { userId_token: { userId: session.id, token } },
      create: { userId: session.id, token },
      update: {},
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to register token" }, { status: 500 });
  }
}
