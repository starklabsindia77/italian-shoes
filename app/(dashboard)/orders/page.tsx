"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RefreshCcw, Edit3, Search } from "lucide-react";

type Currency = "USD" | "EUR" | "GBP";
type OrderStatus =
  | "design_received"
  | "in_production"
  | "quality_check"
  | "ready_to_ship"
  | "shipped"
  | "delivered"
  | "cancelled";

type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "partially_refunded";

type FulfillmentStatus = "unfulfilled" | "in_production" | "ready_to_ship" | "shipped" | "delivered";

type OrderLite = {
  id: string;
  orderId?: string | null;
  orderNumber: string;
  customerEmail?: string | null;
  customerName?: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  total: number;           // cents
  currency: Currency;
  createdAt?: string;
  updatedAt?: string;
};

const FALLBACK: OrderLite[] = [
  {
    id: "ord_1001",
    orderId: "O-1001",
    orderNumber: "1001",
    customerEmail: "maria.rossi@example.com",
    customerName: "Maria Rossi",
    status: "in_production",
    paymentStatus: "paid",
    fulfillmentStatus: "in_production",
    total: 19999,
    currency: "USD",
    createdAt: "2025-01-09T12:00:00.000Z",
  },
  {
    id: "ord_1002",
    orderId: "O-1002",
    orderNumber: "1002",
    customerEmail: "guest@example.com",
    customerName: "Guest",
    status: "design_received",
    paymentStatus: "pending",
    fulfillmentStatus: "unfulfilled",
    total: 12999,
    currency: "USD",
    createdAt: "2025-01-10T09:30:00.000Z",
  },
];

export default function OrdersListPage() {
  const [items, setItems] = React.useState<OrderLite[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<OrderStatus | "all">("all");

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (q) params.set("q", q);
      if (status !== "all") params.set("status", status);
      const res = await fetch(`/api/orders?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      setItems((data.items ?? data ?? []) as OrderLite[]);
    } catch {
      setItems(FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">Browse and manage orders & manufacturing status.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}><RefreshCcw className="mr-2 size-4" />Refresh</Button>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle>All Orders</CardTitle>
          <CardDescription>Search by order number, email, or name. Filter by status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_200px_120px]">
            <Input
              placeholder="Search orders…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") load(); }}
            />
            <Select value={status} onValueChange={(v: OrderStatus | "all") => setStatus(v)}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="design_received">Design Received</SelectItem>
                <SelectItem value="in_production">In Production</SelectItem>
                <SelectItem value="quality_check">Quality Check</SelectItem>
                <SelectItem value="ready_to_ship">Ready to Ship</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={load}><Search className="mr-2 size-4" />Search</Button>
          </div>

          <Separator />

          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Fulfillment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-0"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.orderNumber}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {o.customerName ?? "—"}<br />
                      <span className="text-xs">{o.customerEmail ?? "—"}</span>
                    </TableCell>
                    <TableCell>{badgeForStatus(o.status)}</TableCell>
                    <TableCell>{badgeForPayment(o.paymentStatus)}</TableCell>
                    <TableCell>{badgeForFulfillment(o.fulfillmentStatus)}</TableCell>
                    <TableCell>{formatCurrency(o.total, o.currency)}</TableCell>
                    <TableCell className="text-muted-foreground">{o.createdAt?.slice(0, 10) ?? "—"}</TableCell>
                    <TableCell className="flex justify-end">
                      <Button size="sm" asChild>
                        <Link href={`/orders/${o.id}`}><Edit3 className="mr-2 size-4" />Open</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-6 text-center text-sm text-muted-foreground">
                      No orders found.
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

function badgeForStatus(s: OrderStatus) {
  const map: Record<OrderStatus, string> = {
    design_received: "Design Received",
    in_production: "In Production",
    quality_check: "Quality Check",
    ready_to_ship: "Ready to Ship",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  const variant = s === "cancelled" ? "secondary" : s === "delivered" ? "default" : "outline";
  return <Badge variant={variant as any}>{map[s]}</Badge>;
}

function badgeForPayment(s: PaymentStatus) {
  const variant = s === "paid" ? "default" : s === "pending" ? "secondary" : "outline";
  return <Badge variant={variant as any}>{s.replaceAll("_", " ")}</Badge>;
}

function badgeForFulfillment(s: FulfillmentStatus) {
  const label = s.replaceAll("_", " ");
  const variant = s === "delivered" ? "default" : s === "unfulfilled" ? "secondary" : "outline";
  return <Badge variant={variant as any}>{label}</Badge>;
}

function formatCurrency(cents: number, currency: Currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format((cents ?? 0) / 100);
  } catch {
    return `$${(cents ?? 0) / 100}`;
  }
}
