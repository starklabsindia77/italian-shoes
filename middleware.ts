import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * The admin lives in the `(dashboard)` route group, which adds no URL segment —
 * so its pages are served from `/products`, `/orders`, `/settings/*` and so on,
 * NOT from `/dashboard/*`. Every one of those prefixes has to be listed here or
 * the page renders for anonymous visitors.
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/analytics",
  "/assets",
  "/audit",
  "/customers",
  "/discounts",
  "/logs",
  "/materials",
  "/orders",
  "/panels",
  "/production",
  "/products",
  "/profile",
  "/reports",
  "/settings",
  "/shipments",
  "/sizes",
  "/soles",
  "/styles",
];

/** Storefront routes that collide with an admin prefix and must stay public. */
const PUBLIC_EXCEPTIONS = [
  "/orders/success",
];

function isProtected(pathname: string) {
  if (PUBLIC_EXCEPTIONS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return false;
  }
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!isProtected(pathname)) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Run on page navigations only: skip /api (route handlers do their own
   * authorization), Next internals, and any path containing a dot — which
   * covers every static file under /public (leather/1.jpg, hdri/*.hdr, GLBs).
   */
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
