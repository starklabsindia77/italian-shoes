// app/(dashboard)/page.tsx
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  ShoppingCart,
  Factory,
  DollarSign,
  Plus,
  Truck,
} from "lucide-react";

function formatCurrency(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function DashboardPage() {
  // You can replace these with real queries
  const kpis = [
    {
      label: "Gross Sales (30d)",
      value: formatCurrency(238400, "USD"),
      icon: DollarSign,
      sub: "+12% vs prev.",
    },
    {
      label: "Orders (30d)",
      value: "184",
      icon: ShoppingCart,
      sub: "+8 new today",
    },
    {
      label: "In Production",
      value: "23",
      icon: Factory,
      sub: "7 in QC",
    },
    {
      label: "Low Stock Variants",
      value: "9",
      icon: Package,
      sub: "Reorder soon",
    },
  ];

  const recent = [
    {
      id: "ord_10234",
      number: "MTO-10234",
      customer: "A. Romano",
      total: 18999,
      currency: "USD",
      status: "IN_PRODUCTION",
    },
    {
      id: "ord_10233",
      number: "MTO-10233",
      customer: "S. Marino",
      total: 14999,
      currency: "USD",
      status: "QUALITY_CHECK",
    },
    {
      id: "ord_10232",
      number: "MTO-10232",
      customer: "P. Bianchi",
      total: 21999,
      currency: "USD",
      status: "READY_TO_SHIP",
    },
    {
      id: "ord_10231",
      number: "MTO-10231",
      customer: "M. Conti",
      total: 16999,
      currency: "USD",
      status: "DESIGN_RECEIVED",
    },
  ] as const;

  const board = {
    DESIGN_RECEIVED: 6,
    IN_PRODUCTION: 23,
    QUALITY_CHECK: 7,
    READY_TO_SHIP: 5,
    SHIPPED: 41,
  };

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of sales, orders, and production pipeline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/orders">View Orders</Link>
          </Button>
          <Button asChild>
            <Link href="/products/new">
              <Plus className="mr-2 size-4" />
              New Product
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, sub }) => (
          <Card key={label} className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className="size-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Production snapshot */}
      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-3 rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Last 24–48 hours of activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden md:table-cell">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-0"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.number}</TableCell>
                      <TableCell>{o.customer}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {formatCurrency(o.total, o.currency)}
                      </TableCell>
                      <TableCell>
                        <OrderBadge status={o.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/orders/${o.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-3 flex justify-end">
              <Button asChild variant="ghost" size="sm">
                <Link href="/orders">See all orders →</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle>Production Queue</CardTitle>
            <CardDescription>Live snapshot</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <RowStat label="Design received" value={board.DESIGN_RECEIVED} />
            <RowStat label="In production" value={board.IN_PRODUCTION} />
            <RowStat label="Quality check" value={board.QUALITY_CHECK} />
            <RowStat label="Ready to ship" value={board.READY_TO_SHIP} />
            <RowStat label="Shipped (7d)" value={board.SHIPPED} icon={<Truck className="size-4" />} />
            <div className="pt-1">
              <Button asChild className="w-full">
                <Link href="/production">Open board</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently used admin tasks</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href="/products">Manage products</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/materials">Materials</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/sizes">Sizes</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/panels">Panels</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/shipments">Shipments</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/settings">Settings</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- tiny UI helpers ---------- */

function RowStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function OrderBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { variant: "default" | "secondary" | "destructive" | "outline"; label: string }
  > = {
    DESIGN_RECEIVED: { variant: "secondary", label: "Design received" },
    IN_PRODUCTION: { variant: "default", label: "In production" },
    QUALITY_CHECK: { variant: "outline", label: "Quality check" },
    READY_TO_SHIP: { variant: "default", label: "Ready to ship" },
    SHIPPED: { variant: "secondary", label: "Shipped" },
    DELIVERED: { variant: "secondary", label: "Delivered" },
    CANCELLED: { variant: "destructive", label: "Cancelled" },
  };

  const cfg = map[status] || { variant: "outline", label: status };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
