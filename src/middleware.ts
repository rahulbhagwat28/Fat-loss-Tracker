import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (!path.startsWith("/api/")) return NextResponse.next();

  const origin = request.headers.get("origin") ?? "";
  const isAllowedOrigin =
    origin === "" ||
    /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
    /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin);

  const res = NextResponse.next();
  if (isAllowedOrigin && origin) {
    res.headers.set("Access-Control-Allow-Origin", origin);
  }
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Cookie, Authorization, X-Session-Id");

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: res.headers });
  }
  return res;
}

export const config = { matcher: "/api/:path*" };
