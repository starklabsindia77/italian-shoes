import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export function ok(data: unknown, init?: number | ResponseInit) {
  return NextResponse.json(data, typeof init === "number" ? { status: init } : init);
}
export function bad(message = "Bad Request", status = 400) {
  return NextResponse.json({ error: message }, { status });
}
export function notFound(message = "Not Found") { return bad(message, 404); }
export function forbidden(message = "Forbidden") { return bad(message, 403); }
export function server(e: unknown) {
  console.error(e);
  const err = e as { message?: string; code?: number; stack?: string };
  const status = err?.code && typeof err.code === "number" ? err.code : 500;
  return NextResponse.json({ error: err?.message ?? "Server Error" }, { status });
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw Object.assign(new Error("Unauthorized"), { code: 401 });
  return session;
}
export async function requireAdmin() {
  const session = await requireAuth();
  if ((session.user as { role?: string }).role !== "ADMIN") throw Object.assign(new Error("Forbidden"), { code: 403 });
  return session;
}
export async function requireAnyRole(roles: string[]) {
  const session = await requireAuth();
  const role = (session.user as { role?: string }).role;
  if (!role || !roles.includes(role)) throw Object.assign(new Error("Forbidden"), { code: 403 });
  return session;
}
export async function requirePermission(perm: string) {
  const session = await requireAuth();
  const u = session.user as { role?: string; permissions?: string[] };
  if (u.role === "ADMIN") return session;
  if (u.permissions?.includes(perm)) return session;
  throw Object.assign(new Error("Forbidden"), { code: 403 });
}

export function getSearchParams(req: Request) {
  const url = new URL(req.url);
  return url.searchParams;
}
export function pagination(req: Request, { maxLimit = 100 } = {}) {
  const sp = getSearchParams(req);
  const page = Math.max(1, Number(sp.get("page") ?? "1"));
  const limit = Math.min(maxLimit, Math.max(1, Number(sp.get("limit") ?? "20")));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
