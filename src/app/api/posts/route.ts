import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        comments: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        likes: { select: { userId: true } },
      },
    });
    return NextResponse.json(posts);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const { imageUrl, caption } = await request.json();
    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl required" }, { status: 400 });
    }
    const post = await prisma.post.create({
      data: { userId: session.id, imageUrl, caption: caption || null },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        comments: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        likes: { select: { userId: true } },
      },
    });
    return NextResponse.json(post);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
