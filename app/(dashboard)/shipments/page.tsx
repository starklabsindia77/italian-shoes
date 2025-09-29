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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCcw, Search, ExternalLink, Truck, PackageCheck, LocateFixed, FileDown } from "lucide-react";

type ShipStatus = "pending" | "picked_up" | "in_transit" | "delivered" | "failed";

type Shipment = {
  id: string;
  orderId: string;
  orderNumber: string;
  customer?: string | null;
  courierName?: string | null;
  awbNumber?: string | null;
  trackingUrl?: string | null;
  labelUrl?: string | null;
  status: ShipStatus;
  estimatedDelivery?: string | null; // ISO date
  actualDelivery?: string | null;    // ISO date
  createdAt?: string | null;         // ISO date
};

const FALLBACK: Shipment[] = [
  {
    id: "sh_1001",
    orderId: "ord_1001",
    orderNumber: "1001",
    customer: "Maria Rossi",
    courierName: "DHL",
    awbNumber: "DHL123456789",
    trackingUrl: "https://example.com/track/DHL123456789",
    labelUrl: "#",
    status: "in_transit",
    estimatedDelivery: "2025-01-18T12:00:00.000Z",
    createdAt: "2025-01-12T10:00:00.000Z",
  },
  {
    id: "sh_1002",
    orderId: "ord_1002",
    orderNumber: "1002",
    customer: "Guest",
    courierName: "UPS",
    awbNumber: "1Z999AA10123456784",
    trackingUrl: "https://example.com/track/1Z999AA10123456784",
    labelUrl: "#",
    status: "pending",
    createdAt: "2025-01-13T09:15:00.000Z",
  },
  {
    id: "sh_1003",
    orderId: "ord_1003",
    orderNumber: "1003",
    customer: "Paolo Bianchi",
    courierName: "FedEx",
    awbNumber: "1234-5678-9012",
    status: "delivered",
    actualDelivery: "2025-01-10T17:35:00.000Z",
    createdAt: "2025-01-08T14:00:00.000Z",
  },
];

export default function ShipmentsPage() {
  const [items, setItems] = React.useState<Shipment[]>([]);
  const [loading, setLoading] = React.useState(true);

  // filters
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<ShipStatus | "all">("all");

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (q) params.set("q", q);
      if (status !== "all") params.set("status", status);
      const r = await fetch(`/api/shipments?${params.toString()}`, { cache: "no-store" });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setItems((d.items ?? d ?? []) as Shipment[]);
    } catch {
      setItems(FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  // PATCH helper
  const patch = async (id: string, body: Partial<Shipment>) => {
    const run = async () => {
      const res = await fetch(`/api/shipments/${id}`, { method: "PUT", body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    };
    const p = run();
    toast.promise(p, { loading: "Updating…", success: "Updated", error: "Failed to update" });
    await p;
    await load();
  };

  // Optional helpers (wire if you add endpoints)
  const doTrack = async (id: string) => {
    const run = async () => {
      const res = await fetch(`/api/shipments/${id}/track`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    };
    const p = run();
    toast.promise(p, { loading: "Syncing tracking…", success: "Tracking synced", error: "Failed to sync" });
    await p;
    await load();
  };

  const doLabel = async (id: string) => {
    const run = async () => {
      const res = await fetch(`/api/shipments/${id}/label`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    };
    const p = run();
    toast.promise(p, { loading: "Requesting label…", success: "Label ready", error: "Failed to request label" });
    await p;
    await load();
  };

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Shipments</h1>
          <p className="text-sm text-muted-foreground">Labels, tracking, and delivery status.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}><RefreshCcw className="mr-2 size-4" />Refresh</Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard/orders?status=ready_to_ship"><PackageCheck className="mr-2 size-4" />Create Shipment</Link>
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle>All Shipments</CardTitle>
          <CardDescription>Search by order number, AWB, courier, or customer. Filter by status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_200px_120px]">
            <Input
              placeholder="Search shipments… (e.g., 1005, DHL123, Maria)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") load(); }}
            />
            <Select value={status} onValueChange={(v: ShipStatus | "all") => setStatus(v)}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="picked_up">Picked up</SelectItem>
                <SelectItem value="in_transit">In transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
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
                  <TableHead>Courier</TableHead>
                  <TableHead>AWB</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>ETA / Delivered</TableHead>
                  <TableHead className="w-0"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <Link className="underline underline-offset-2" href={`/dashboard/orders/${s.orderId}`}>
                        {s.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.customer ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{s.courierName ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{s.awbNumber ?? "—"}</TableCell>
                    <TableCell>{statusBadge(s.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.actualDelivery
                        ? `Delivered ${fmtDate(s.actualDelivery)}`
                        : s.estimatedDelivery
                          ? `ETA ${fmtDate(s.estimatedDelivery)}`
                          : "—"}
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      {/* Open tracking */}
                      <Button size="sm" variant="outline" asChild disabled={!s.trackingUrl}>
                        <a href={s.trackingUrl ?? "#"} target="_blank" rel="noreferrer">
                          <ExternalLink className="mr-2 size-4" /> Track
                        </a>
                      </Button>
                      {/* Request label (optional endpoint) */}
                      <Button size="sm" variant="outline" onClick={() => doLabel(s.id)}>
                        <FileDown className="mr-2 size-4" /> Label
                      </Button>
                      {/* Sync tracking (optional endpoint) */}
                      <Button size="sm" variant="outline" onClick={() => doTrack(s.id)}>
                        <LocateFixed className="mr-2 size-4" /> Sync
                      </Button>
                      {/* Quick status actions */}
                      {s.status !== "picked_up" && (
                        <Button size="sm" variant="secondary" onClick={() => patch(s.id, { status: "picked_up" })}>
                          <Truck className="mr-2 size-4" /> Picked up
                        </Button>
                      )}
                      {s.status !== "in_transit" && (
                        <Button size="sm" onClick={() => patch(s.id, { status: "in_transit" })}>
                          <Truck className="mr-2 size-4" /> In transit
                        </Button>
                      )}
                      {s.status !== "delivered" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            patch(s.id, { status: "delivered", actualDelivery: new Date().toISOString() })
                          }
                        >
                          <PackageCheck className="mr-2 size-4" /> Delivered
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                      No shipments found.
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

function statusBadge(s: ShipStatus) {
  const label = s.replaceAll("_", " ");
  const variant =
    s === "delivered" ? "default" :
    s === "pending" ? "secondary" :
    s === "failed" ? "secondary" : "outline";
  return <Badge variant={variant as any}>{label}</Badge>;
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toISOString().slice(0, 10);
  } catch {
    return iso.slice(0, 10);
  }
}
