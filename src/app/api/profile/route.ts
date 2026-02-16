import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { age: true, sex: true, heightInches: true, weightLbs: true },
    });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(user);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const data: {
      avatarUrl?: string;
      age?: number | null;
      sex?: string | null;
      heightInches?: number | null;
      weightLbs?: number | null;
    } = {};
    if (body.avatarUrl !== undefined) data.avatarUrl = body.avatarUrl;
    if (body.age !== undefined) data.age = body.age === null || body.age === "" ? null : Number(body.age);
    if (typeof data.age === "number" && (data.age < 0 || data.age > 150)) delete data.age;
    if (body.sex !== undefined) data.sex = body.sex === "" ? null : body.sex;
    if (body.heightInches !== undefined)
      data.heightInches =
        body.heightInches === null || body.heightInches === "" ? null : Number(body.heightInches);
    if (typeof data.heightInches === "number" && (data.heightInches < 0 || data.heightInches > 120))
      delete data.heightInches;
    if (body.weightLbs !== undefined)
      data.weightLbs =
        body.weightLbs === null || body.weightLbs === "" ? null : Number(body.weightLbs);
    if (typeof data.weightLbs === "number" && (data.weightLbs < 0 || data.weightLbs > 1000))
      delete data.weightLbs;

    await prisma.user.update({
      where: { id: session.id },
      data,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
