import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/** Client upload handler – file goes directly from client to Blob (bypasses 4.5MB limit). */
export async function POST(request: Request) {
  try {
    await requireAuth(request);
    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, _clientPayload, multipart) => {
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "video/mp4",
            "video/quicktime",
            "video/webm",
            "video/x-m4v",
          ],
          maximumSizeInBytes: 500 * 1024 * 1024, // 500 MB
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // Optional: update DB, etc. For posts we create the post after upload.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 400 }
    );
  }
}
