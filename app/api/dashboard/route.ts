import { NextResponse } from "next/server";
import { requirePermission, server } from "@/lib/api-helpers";
import { getDashboardMetrics } from "@/lib/dashboard-service";

export async function GET() {
  try {
    await requirePermission("dashboard.view");
    const data = await getDashboardMetrics();
    return NextResponse.json(data);
  } catch (e) {
    return server(e);
  }
}
