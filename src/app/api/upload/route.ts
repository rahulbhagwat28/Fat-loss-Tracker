import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAuth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        {
          error:
            "Image upload not configured. In Vercel: Storage → create Blob store, then Settings → Environment Variables → add BLOB_READ_WRITE_TOKEN, then redeploy.",
        },
        { status: 503 }
      );
    }
    await requireAuth();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "post"; // "post" | "avatar" | "progress"
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const ext = (file.name && /\.\w+$/.test(file.name)) ? file.name.replace(/^.*\./, "") : "jpg";
    const filename = `${uuidv4()}.${ext}`;
    const pathname = `uploads/${type}/${filename}`;

    const blob = await put(pathname, file, { access: "public" });
    return NextResponse.json({ url: blob.url });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
