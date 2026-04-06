import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== "admin") {
      return NextResponse.redirect(new URL("/auth/login?redirect=/admin", req.url));
    }
  }

  if (pathname.startsWith("/account") || pathname.startsWith("/checkout")) {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.redirect(
        new URL(`/auth/login?redirect=${encodeURIComponent(pathname)}`, req.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/checkout/:path*"],
};
