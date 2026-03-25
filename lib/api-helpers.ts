import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export function ok(data: any, init?: number | ResponseInit) {
  return NextResponse.json(data, typeof init === "number" ? { status: init } : init);
}
export function bad(message = "Bad Request", status = 400) {
  return NextResponse.json({ error: message }, { status });
}
export function notFound(message = "Not Found") { return bad(message, 404); }
export function forbidden(message = "Forbidden") { return bad(message, 403); }
export function server(e: any) {
  console.error(e);
  try {
    const fs = require('fs');
    fs.appendFileSync('/tmp/api-error.log', `[${new Date().toISOString()}] ERROR: ${e?.message}\n${e?.stack}\n\n`);
  } catch (err) {}
  const status = e?.code && typeof e.code === "number" ? e.code : 500;
  return NextResponse.json({ error: e?.message ?? "Server Error" }, { status });
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw Object.assign(new Error("Unauthorized"), { code: 401 });
  return session;
}
export async function requireAdmin() {
  const session = await requireAuth();
  if ((session.user as any).role !== "ADMIN") throw Object.assign(new Error("Forbidden"), { code: 403 });
  return session;
}
export async function requireAnyRole(roles: string[]) {
  const session = await requireAuth();
  if (!roles.includes((session.user as any).role)) throw Object.assign(new Error("Forbidden"), { code: 403 });
  return session;
}
export async function requirePermission(perm: string) {
  const session = await requireAuth();
  const u = session.user as any;
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
