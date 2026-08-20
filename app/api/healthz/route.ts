import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ALB target-group health check. Deliberately trivial — no DB call — so a
// brief database blip doesn't make the ALB mark the only instance unhealthy
// and cycle it. DB-inclusive health for humans lives at /api/health.
export async function GET() {
  return NextResponse.json({ ok: true });
}
