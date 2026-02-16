import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAuth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

/** GET: quick check if Blob token is available in this deployment (no auth). */
export async function GET() {
  const configured = !!BLOB_TOKEN;
  return NextResponse.json({
    configured,
    envVarName: "BLOB_READ_WRITE_TOKEN",
    hint: configured
      ? undefined
      : "In Vercel: Storage → your Blob store → ensure project is connected, or Settings → Environment Variables → add BLOB_READ_WRITE_TOKEN for Production/Preview, then Redeploy.",
  });
}

export async function POST(request: Request) {
  try {
    if (!BLOB_TOKEN) {
      return NextResponse.json(
        {
          error:
            "Image upload not configured. Add BLOB_READ_WRITE_TOKEN in Vercel (Settings → Environment Variables), then Redeploy.",
        },
        { status: 503 }
      );
    }
    await requireAuth(request);
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "post"; // "post" | "avatar" | "progress"
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const ext = (file.name && /\.\w+$/.test(file.name)) ? file.name.replace(/^.*\./, "") : "jpg";
    const filename = `${uuidv4()}.${ext}`;
    const pathname = `uploads/${type}/${filename}`;

    const blob = await put(pathname, file, { access: "public", token: BLOB_TOKEN });
    return NextResponse.json({ url: blob.url });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
