// app/api/analytics/overview/route.ts
import { Currency } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ok, server, requirePermission, getSearchParams } from "@/lib/api-helpers";

type Range = "7d" | "30d" | "90d";

const DAYS_BY_RANGE: Record<Range, number> = { "7d": 7, "30d": 30, "90d": 90 };

function startOfDayUtc(daysAgo: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d;
}

/** Fractional change vs the previous period; 0 when there is no baseline. */
function delta(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 1;
  return (current - previous) / previous;
}

export async function GET(req: Request) {
  try {
    await requirePermission("dashboard.view");

    const sp = getSearchParams(req);
    const rangeParam = sp.get("range");
    const range: Range = rangeParam === "30d" || rangeParam === "90d" ? rangeParam : "7d";
    const days = DAYS_BY_RANGE[range];

    const periodStart = startOfDayUtc(days - 1);
    const previousStart = startOfDayUtc(days * 2 - 1);

    // Cancelled orders are excluded so revenue matches the dashboard metrics.
    const notCancelled = { status: { not: "CANCELLED" as const } };

    const [current, previous] = await Promise.all([
      prisma.order.findMany({
        where: { ...notCancelled, createdAt: { gte: periodStart } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          customerEmail: true,
          customerFirstName: true,
          customerLastName: true,
          total: true,
          currency: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.order.findMany({
        where: {
          ...notCancelled,
          createdAt: { gte: previousStart, lt: periodStart },
        },
        select: { total: true, customerEmail: true },
      }),
    ]);

    const revenue = current.reduce((s, o) => s + o.total, 0);
    const ordersCount = current.length;
    const aov = ordersCount ? Math.round(revenue / ordersCount) : 0;
    const customers = new Set(current.map((o) => o.customerEmail)).size;

    const prevRevenue = previous.reduce((s, o) => s + o.total, 0);
    const prevOrders = previous.length;
    const prevAov = prevOrders ? Math.round(prevRevenue / prevOrders) : 0;
    const prevCustomers = new Set(previous.map((o) => o.customerEmail)).size;

    // Currency is per-order in the schema; report the most common one in range.
    const currencyCounts = new Map<Currency, number>();
    for (const o of current) {
      currencyCounts.set(o.currency, (currencyCounts.get(o.currency) ?? 0) + 1);
    }
    const currency: Currency =
      [...currencyCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "INR";

    // Daily series, zero-filled across the whole range.
    const byDay = new Map<string, { revenue: number; orders: number }>();
    for (const o of current) {
      const key = o.createdAt.toISOString().slice(0, 10);
      const cur = byDay.get(key) ?? { revenue: 0, orders: 0 };
      cur.revenue += o.total;
      cur.orders += 1;
      byDay.set(key, cur);
    }
    const series = Array.from({ length: days }, (_, i) => {
      const key = startOfDayUtc(days - 1 - i).toISOString().slice(0, 10);
      const cur = byDay.get(key) ?? { revenue: 0, orders: 0 };
      return { date: key, revenue: cur.revenue, orders: cur.orders };
    });

    const recentOrders = current.slice(0, 10).map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customer:
        [o.customerFirstName, o.customerLastName].filter(Boolean).join(" ") ||
        o.customerEmail ||
        "Guest",
      total: o.total,
      currency: o.currency,
      status: o.status.toLowerCase(),
    }));

    // Top products by revenue over the range, aggregated from order items.
    const grouped = await prisma.orderItem.groupBy({
      by: ["productId", "productTitle"],
      where: { order: { ...notCancelled, createdAt: { gte: periodStart } } },
      _sum: { totalPrice: true },
      _count: { _all: true },
      orderBy: { _sum: { totalPrice: "desc" } },
      take: 5,
    });
    const topProducts = grouped.map((g) => ({
      id: g.productId ?? g.productTitle,
      title: g.productTitle,
      revenue: g._sum.totalPrice ?? 0,
      orders: g._count._all,
    }));

    return ok({
      currency,
      kpis: {
        revenue,
        orders: ordersCount,
        avgOrderValue: aov,
        customers,
        revenueDelta: delta(revenue, prevRevenue),
        ordersDelta: delta(ordersCount, prevOrders),
        aovDelta: delta(aov, prevAov),
        customersDelta: delta(customers, prevCustomers),
      },
      series,
      recentOrders,
      topProducts,
    });
  } catch (e) {
    return server(e);
  }
}
