import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(searchParams.get("limit")) || DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    const [pics, total] = await Promise.all([
      prisma.progressPic.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.progressPic.count({ where: { userId: session.id } }),
    ]);

    return NextResponse.json({
      pics,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch progress pics" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { imageUrl, label } = body;

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "imageUrl required" }, { status: 400 });
    }

    const pic = await prisma.progressPic.create({
      data: {
        userId: session.id,
        imageUrl: imageUrl.trim(),
        label: typeof label === "string" && label.trim() ? label.trim() : null,
      },
    });
    return NextResponse.json(pic);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to add progress pic" }, { status: 500 });
  }
}
