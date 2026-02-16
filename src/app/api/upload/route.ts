import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireAuth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    await requireAuth();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "post"; // "post" | "avatar" | "progress"
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = path.extname(file.name) || ".jpg";
    const filename = `${uuidv4()}${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads", type);
    await mkdir(dir, { recursive: true });
    const filepath = path.join(dir, filename);
    await writeFile(filepath, buffer);
    const url = `/uploads/${type}/${filename}`;
    return NextResponse.json({ url });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
