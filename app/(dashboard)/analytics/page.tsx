"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { RefreshCcw, ArrowUpRight, ArrowDownRight } from "lucide-react";

type Currency = "USD" | "EUR" | "GBP" | "INR";

type OverviewPayload = {
  range: "7d" | "30d" | "90d";
};

type Kpis = {
  revenue: number;         // cents
  orders: number;
  avgOrderValue: number;   // cents
  customers: number;
  // % changes vs prev period
  revenueDelta: number;    // -0.12 = -12%
  ordersDelta: number;
  aovDelta: number;
  customersDelta: number;
};

type SeriesPoint = { date: string; revenue: number; orders: number };
type TopProduct = { id: string; title: string; revenue: number; orders: number };

type Overview = {
  kpis: Kpis;
  currency: Currency;
  series: SeriesPoint[]; // daily points for range
  recentOrders: { id: string; orderNumber: string; customer: string; total: number; currency: Currency; status: string }[];
  topProducts: TopProduct[];
};

const EMPTY: Overview = {
  currency: "INR",
  kpis: {
    revenue: 0, orders: 0, avgOrderValue: 0, customers: 0,
    revenueDelta: 0, ordersDelta: 0, aovDelta: 0, customersDelta: 0,
  },
  series: [],
  recentOrders: [],
  topProducts: [],
};

export default function DashboardOverviewPage() {
  const [range, setRange] = React.useState<OverviewPayload["range"]>("7d");
  const [data, setData] = React.useState<Overview | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics/overview?range=${range}`, { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Request failed (${res.status})`);
      }
      setData((await res.json()) as Overview);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [range]);

  React.useEffect(() => { load(); }, [range, load]);

  const d = data ?? EMPTY;
  const maxRevenue = Math.max(...d.series.map((p) => p.revenue), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">Sales, orders, and customers at a glance.</p>
        </div>
        <div className="flex gap-2">
          <Select value={range} onValueChange={(v: OverviewPayload["range"]) => setRange(v)}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Range" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={load} disabled={loading}><RefreshCcw className={`mr-2 size-4 ${loading ? 'animate-spin' : ''}`} />Refresh</Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Could not load analytics: {error}. The figures below are not live — retry with Refresh.
        </div>
      )}

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Revenue" value={formatCurrency(d.kpis.revenue, d.currency)} delta={d.kpis.revenueDelta} />
        <KpiCard title="Orders" value={String(d.kpis.orders)} delta={d.kpis.ordersDelta} />
        <KpiCard title="Avg. Order Value" value={formatCurrency(d.kpis.avgOrderValue, d.currency)} delta={d.kpis.aovDelta} />
        <KpiCard title="Customers" value={String(d.kpis.customers)} delta={d.kpis.customersDelta} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Revenue chart (CSS bars = no extra deps) */}
        <Card className="xl:col-span-2 rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Daily revenue for the selected range.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 sm:gap-2 h-48">
              {d.series.map((p, i) => {
                const h = Math.max(6, Math.round((p.revenue / maxRevenue) * 100));
                // 30d/90d ranges would render an unreadable wall of labels, so
                // thin them out to roughly seven evenly spaced ticks.
                const labelEvery = Math.ceil(d.series.length / 7);
                const showLabel = i % labelEvery === 0 || i === d.series.length - 1;
                return (
                  <div
                    key={p.date}
                    className="flex flex-1 min-w-0 flex-col items-center justify-end gap-2"
                    title={`${p.date}: ${formatCurrency(p.revenue, d.currency)} (${p.orders} orders)`}
                  >
                    <div className="w-full rounded-md bg-primary/70" style={{ height: `${h}%` }} />
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {showLabel ? p.date.slice(5) : " "}
                    </div>
                  </div>
                );
              })}
              {d.series.length === 0 && (
                <div className="w-full text-center text-sm text-muted-foreground">No data in this range.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top products */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle>Top Products</CardTitle>
            <CardDescription>By revenue.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {d.topProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-muted-foreground">{p.orders} orders</div>
                </div>
                <div className="text-sm font-medium">{formatCurrency(p.revenue, d.currency)}</div>
              </div>
            ))}
            {d.topProducts.length === 0 && <div className="text-sm text-muted-foreground">No products yet.</div>}
          </CardContent>
        </Card>
      </div>

      {/* Recent orders */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest orders across all channels.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-0"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.recentOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.orderNumber}</TableCell>
                    <TableCell className="text-muted-foreground">{o.customer}</TableCell>
                    <TableCell>{formatCurrency(o.total, o.currency)}</TableCell>
                    <TableCell><Badge variant="outline">{o.status.replaceAll("_", " ")}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/orders/${o.id}`}>Open</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {d.recentOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                      No orders yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ title, value, delta }: { title: string; value: string; delta: number }) {
  const up = delta >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
        <CardDescription className="sr-only">{title}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-end justify-between">
        <div className="text-2xl font-semibold">{value}</div>
        <div className={`flex items-center text-sm ${up ? "text-emerald-600" : "text-rose-600"}`}>
          <Icon className="mr-1 size-4" />
          {(Math.abs(delta) * 100).toFixed(0)}%
        </div>
      </CardContent>
    </Card>
  );
}

function formatCurrency(cents: number, currency: Currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format((cents ?? 0) / 100);
  } catch {
    return `$${(cents ?? 0) / 100}`;
  }
}
