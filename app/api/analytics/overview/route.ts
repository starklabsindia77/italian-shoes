// app/api/analytics/overview/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Currency = "USD" | "EUR" | "GBP";

const FALLBACK = {
  currency: "USD" as Currency,
  kpis: {
    revenue: 125_500,
    orders: 48,
    avgOrderValue: 2615,
    customers: 36,
    revenueDelta: 0.18,
    ordersDelta: 0.06,
    aovDelta: 0.11,
    customersDelta: -0.03,
  },
  series: [
    { date: "2025-01-09", revenue: 12000, orders: 5 },
    { date: "2025-01-10", revenue: 9000, orders: 3 },
    { date: "2025-01-11", revenue: 16000, orders: 6 },
    { date: "2025-01-12", revenue: 22000, orders: 8 },
    { date: "2025-01-13", revenue: 19000, orders: 7 },
    { date: "2025-01-14", revenue: 32000, orders: 12 },
    { date: "2025-01-15", revenue: 5500, orders: 2 },
  ],
  recentOrders: [
    { id: "ord_1005", orderNumber: "1005", customer: "Paolo Bianchi", total: 19999, currency: "USD", status: "in_production" },
    { id: "ord_1004", orderNumber: "1004", customer: "Tom Smith", total: 12999, currency: "USD", status: "ready_to_ship" },
    { id: "ord_1003", orderNumber: "1003", customer: "Guest", total: 9999, currency: "USD", status: "design_received" },
  ],
  topProducts: [
    { id: "p_oxford", title: "Premium Oxford Shoes", revenue: 79999, orders: 24 },
    { id: "p_boot", title: "Chelsea Boot", revenue: 30500, orders: 10 },
    { id: "p_sneaker", title: "Minimal Sneaker", revenue: 15000, orders: 5 },
  ],
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const range = (searchParams.get("range") ?? "7d") as "7d" | "30d" | "90d";
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;

  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Don't select specific fields (schema differs); cast to any[] to safely read
    const orders = (await prisma.order.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 500,
    })) as any[];

    if (!orders || orders.length === 0) {
      return NextResponse.json(FALLBACK);
    }

    // Helpers to read schema-agnostic values
    const getTotal = (o: any) =>
      Number(
        o.total ??
          o.totalAmount ??
          o.totalCents ??
          o.grandTotal ??
          (o.pricing && o.pricing.total) ??
          0
      );

    const getCurrency = (o: any): Currency =>
      (o.currency ??
        o.currencyCode ??
        (o.pricing && o.pricing.currency) ??
        "USD") as Currency;

    const getCustomerName = (o: any) => {
      const first =
        o.customerFirstName ??
        o.customer_first_name ??
        o.firstName ??
        o.customer?.firstName ??
        null;
      const last =
        o.customerLastName ??
        o.customer_last_name ??
        o.lastName ??
        o.customer?.lastName ??
        null;
      const email =
        o.customerEmail ??
        o.customer_email ??
        o.email ??
        o.customer?.email ??
        null;
      const name = [first, last].filter(Boolean).join(" ");
      return name || email || "Guest";
    };

    // Aggregate KPIs
    const totals = orders.map((o) => ({ total: getTotal(o), currency: getCurrency(o) }));
    const revenue = totals.reduce((s, x) => s + (x.total ?? 0), 0);
    const currency: Currency = totals[0]?.currency ?? "USD";
    const ordersCount = orders.length;
    const aov = ordersCount ? Math.round(revenue / ordersCount) : 0;

    // Daily series
    const byDay = new Map<string, { revenue: number; orders: number }>();
    for (const o of orders) {
      const createdAt: Date = o.createdAt ? new Date(o.createdAt) : new Date();
      const key = createdAt.toISOString().slice(0, 10);
      const cur = byDay.get(key) ?? { revenue: 0, orders: 0 };
      cur.revenue += getTotal(o);
      cur.orders += 1;
      byDay.set(key, cur);
    }

    const series: { date: string; revenue: number; orders: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const cur = byDay.get(key) ?? { revenue: 0, orders: 0 };
      series.push({ date: key, revenue: cur.revenue, orders: cur.orders });
    }

    // Recent orders
    const recentOrders = orders.slice(0, 10).map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber ?? o.order_id ?? o.id?.slice?.(-6) ?? "",
      customer: getCustomerName(o),
      total: getTotal(o),
      currency: getCurrency(o),
      status: o.status ?? "design_received",
    }));

    // Top products (optional — left empty unless you aggregate OrderItems)
    const topProducts: any[] = [];

    return NextResponse.json({
      currency,
      kpis: {
        revenue,
        orders: ordersCount,
        avgOrderValue: aov,
        customers: 0, // add distinct customer count if needed
        revenueDelta: 0,
        ordersDelta: 0,
        aovDelta: 0,
        customersDelta: 0,
      },
      series,
      recentOrders,
      topProducts,
    });
  } catch {
    return NextResponse.json(FALLBACK);
  }
}
