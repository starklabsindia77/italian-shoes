import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public paths
  if (pathname.startsWith("/login") || pathname.startsWith("/logout") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Protect dashboard pages
  // if (pathname.startsWith("/dashboard")) {
  //   // On HTTP, cookies are non-secure (no __Secure- prefix). Ensure we read the right cookie
  //   const cookiePrefix = process.env.AUTH_COOKIE_PREFIX ?? "next-auth";
  //   const isHttps = req.nextUrl.protocol === "https:" || (process.env.AUTH_COOKIE_SECURE ?? "false") === "true";
  //   const cookieName = `${isHttps ? "__Secure-" : ""}${cookiePrefix}.session-token`;

  //   const token = await getToken({
  //     req,
  //     secret: process.env.NEXTAUTH_SECRET,
  //     secureCookie: isHttps,
  //     cookieName,
  //   });
  //   // if (!token) {
  //   //   const url = new URL("/login", req.url);
  //   //   url.searchParams.set("callbackUrl", req.nextUrl.pathname);
  //   //   return NextResponse.redirect(url);
  //   // }
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/logout", "/api/auth/:path*"],
};
