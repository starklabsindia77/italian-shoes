"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RefreshCcw, Play, CheckCheck, PackageOpen } from "lucide-react";

type OrderLite = {
  id: string;
  orderNumber: string;
  customerName?: string | null;
  status:
    | "design_received"
    | "in_production"
    | "quality_check"
    | "ready_to_ship"
    | "shipped"
    | "delivered"
    | "cancelled";
  createdAt?: string;
};

const FALLBACK: OrderLite[] = [
  { id: "ord_1002", orderNumber: "1002", customerName: "Guest", status: "design_received" },
  { id: "ord_1001", orderNumber: "1001", customerName: "Maria Rossi", status: "in_production" },
  { id: "ord_1003", orderNumber: "1003", customerName: "Paolo Bianchi", status: "quality_check" },
  { id: "ord_1004", orderNumber: "1004", customerName: "Tom Smith", status: "ready_to_ship" },
];

export default function ProductionQueuePage() {
  const [orders, setOrders] = React.useState<OrderLite[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = async () => {
    setLoading(true);
    try {
      // you can support multi-status fetch on backend e.g. /api/orders?status=in_production,quality_check,ready_to_ship,design_received
      const r = await fetch(`/api/orders?limit=200`, { cache: "no-store" });
      const d = await r.json();
      setOrders((d.items ?? d ?? []) as OrderLite[]);
    } catch {
      setOrders(FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const byStage = React.useMemo(() => {
    const g: Record<string, OrderLite[]> = {
      design_received: [],
      in_production: [],
      quality_check: [],
      ready_to_ship: [],
    };
    for (const o of orders) {
      if (g[o.status as keyof typeof g]) g[o.status as keyof typeof g].push(o);
    }
    return g;
  }, [orders]);

  const patch = async (id: string, body: any) => {
    const run = async () => {
      const res = await fetch(`/api/orders/${id}`, { method: "PUT", body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    };
    const p = run();
    toast.promise(p, { loading: "Updating…", success: "Updated", error: "Failed to update" });
    await p;
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Production Queue</h1>
          <p className="text-sm text-muted-foreground">Move orders across manufacturing stages.</p>
        </div>
        <Button variant="outline" onClick={load}><RefreshCcw className="mr-2 size-4" />Refresh</Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <StageCard
          title="Design Received"
          description="Awaiting production start."
          items={byStage.design_received}
          actionLabel="Start Production"
          actionIcon={<Play className="mr-2 size-4" />}
          onAction={(o) => patch(o.id, { status: "in_production", fulfillmentStatus: "in_production" })}
        />

        <StageCard
          title="In Production"
          description="Being manufactured."
          items={byStage.in_production}
          actionLabel="Mark QC"
          actionIcon={<CheckCheck className="mr-2 size-4" />}
          onAction={(o) => patch(o.id, { status: "quality_check" })}
        />

        <StageCard
          title="Quality Check"
          description="Waiting for QC pass."
          items={byStage.quality_check}
          actionLabel="Ready to Ship"
          actionIcon={<PackageOpen className="mr-2 size-4" />}
          onAction={(o) => patch(o.id, { status: "ready_to_ship", fulfillmentStatus: "ready_to_ship" })}
        />

        <StageCard
          title="Ready to Ship"
          description="Package and ship."
          items={byStage.ready_to_ship}
          actionLabel="Open Order"
          actionIcon={null}
          onAction={(o) => window.location.assign(`/orders/${o.id}`)}
        />
      </div>
    </div>
  );
}

function StageCard({
  title, description, items, actionLabel, actionIcon, onAction,
}: {
  title: string;
  description: string;
  items: OrderLite[];
  actionLabel: string;
  actionIcon: React.ReactNode;
  onAction: (o: OrderLite) => void;
}) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-0"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.orderNumber}</TableCell>
                  <TableCell className="text-muted-foreground">{o.customerName ?? "—"}</TableCell>
                  <TableCell>{statusBadge(o.status)}</TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Button size="sm" asChild variant="outline">
                      <Link href={`/orders/${o.id}`}>Open</Link>
                    </Button>
                    <Button size="sm" onClick={() => onAction(o)}>
                      {actionIcon}{actionLabel}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                    No orders in this stage.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function statusBadge(s: OrderLite["status"]) {
  const label = s.replaceAll("_", " ");
  const variant = s === "cancelled" ? "secondary" : s === "delivered" ? "default" : "outline";
  return <Badge variant={variant as any}>{label}</Badge>;
}
