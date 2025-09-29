"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, RefreshCcw, Save, Play, CheckCheck, PackageOpen, Truck, CheckCircle2 } from "lucide-react";

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

type OrderItem = {
  id: string;
  title: string;
  sku?: string | null;
  quantity: number;
  price: number; // cents
  totalPrice: number; // cents
  style?: { styleId: string; styleName: string } | null;
  sole?: { soleId: string; soleName: string } | null;
  size?: { sizeId: string; sizeName: string } | null;
  panelCustomization?: Record<string, { materialName: string; colorName: string }>;
};

type ManufacturingInfo = {
  estimatedProductionTime: number; // days
  actualProductionTime?: number | null;
  productionStartDate?: string | null;
  productionEndDate?: string | null;
  qualityCheckDate?: string | null;
  notes?: string | null;
};

type ShippingInfo = {
  orderId?: string | null;
  awbNumber?: string | null;
  courierName?: string | null;
  courierId?: string | null;
  trackingUrl?: string | null;
  labelUrl?: string | null;
  status: "pending" | "picked_up" | "in_transit" | "delivered" | "failed";
  estimatedDelivery?: string | null;
  actualDelivery?: string | null;
};

type OrderFull = {
  id: string;
  orderId?: string | null;
  orderNumber: string;
  customer: {
    customerId?: string | null;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    isGuest: boolean;
  };
  shipping?: any;
  billing?: any;
  items: OrderItem[];
  pricing: {
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
    currency: Currency;
  };
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  manufacturing: ManufacturingInfo;
  shiprocket: ShippingInfo;
  createdAt?: string;
  updatedAt?: string;
};

const FALLBACK_ORDER: OrderFull = {
  id: "ord_1001",
  orderId: "O-1001",
  orderNumber: "1001",
  customer: {
    customerId: "CUST-001",
    email: "maria.rossi@example.com",
    firstName: "Maria",
    lastName: "Rossi",
    phone: "+39 331 555 1234",
    isGuest: false,
  },
  shipping: { city: "Milan", country: "IT" },
  billing: { city: "Milan", country: "IT" },
  items: [
    {
      id: "it_1",
      title: "Premium Oxford Shoes",
      sku: "SKU-AB12CD34",
      quantity: 1,
      price: 19999,
      totalPrice: 19999,
      style: { styleId: "cap-toe", styleName: "Cap Toe" },
      sole: { soleId: "sole-01", soleName: "Sole 01" },
      size: { sizeId: "us-8", sizeName: "US 8" },
      panelCustomization: {
        "toe-cap": { materialName: "Leather", colorName: "Black Oxford" },
        "upper": { materialName: "Leather", colorName: "Brown Oxford" },
      },
    },
  ],
  pricing: { subtotal: 19999, tax: 0, shipping: 0, discount: 0, total: 19999, currency: "USD" },
  status: "in_production",
  paymentStatus: "paid",
  fulfillmentStatus: "in_production",
  manufacturing: {
    estimatedProductionTime: 10,
    productionStartDate: "2025-01-10T10:00:00.000Z",
    notes: "Priority job",
  },
  shiprocket: { status: "pending" },
  createdAt: "2025-01-09T12:00:00.000Z",
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [order, setOrder] = React.useState<OrderFull | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/orders/${id}`, { cache: "no-store" });
      if (!r.ok) throw new Error();
      const data = (await r.json()) as OrderFull;
      setOrder(data ?? FALLBACK_ORDER);
    } catch {
      setOrder(FALLBACK_ORDER);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { if (id) load(); /* eslint-disable-next-line */ }, [id]);

  const patch = async (body: Partial<OrderFull>) => {
    if (!order) return;
    const run = async () => {
      const res = await fetch(`/api/orders/${order.id}`, { method: "PUT", body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    };
    const p = run();
    toast.promise(p, { loading: "Saving…", success: "Saved", error: "Failed to save" });
    await p;
    await load();
  };

  const updateStatus = (s: OrderStatus) => patch({ status: s });
  const updatePayment = (p: PaymentStatus) => patch({ paymentStatus: p });
  const updateFulfillment = (f: FulfillmentStatus) => patch({ fulfillmentStatus: f });

  const startProduction = () =>
    patch({ status: "in_production", fulfillmentStatus: "in_production",
      manufacturing: { ...order!.manufacturing, productionStartDate: new Date().toISOString() } });

  const markQC = () =>
    patch({ status: "quality_check", manufacturing: { ...order!.manufacturing, qualityCheckDate: new Date().toISOString() } });

  const markReadyToShip = () =>
    patch({ status: "ready_to_ship", fulfillmentStatus: "ready_to_ship" });

  const markShipped = () =>
    patch({ status: "shipped", fulfillmentStatus: "shipped" });

  const markDelivered = () =>
    patch({ status: "delivered", fulfillmentStatus: "delivered",
      shiprocket: { ...order!.shiprocket, status: "delivered", actualDelivery: new Date().toISOString() } });

  if (!order) return null;

  const customerName = [order.customer.firstName, order.customer.lastName].filter(Boolean).join(" ") || "—";

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/orders"><ArrowLeft className="mr-2 size-4" />Back</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Order #{order.orderNumber}</h1>
            <p className="text-sm text-muted-foreground">{order.customer.email} • {customerName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load}><RefreshCcw className="mr-2 size-4" />Refresh</Button>
          <Button disabled={saving} onClick={() => patch({})}><Save className="mr-2 size-4" />Save</Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="manufacturing">Manufacturing</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="mt-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle>Summary</CardTitle>
              <CardDescription>Statuses and totals.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-3">
              <div className="grid gap-3">
                <Field label="Order Status">
                  <Select value={order.status} onValueChange={(v: OrderStatus) => updateStatus(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="design_received">Design Received</SelectItem>
                      <SelectItem value="in_production">In Production</SelectItem>
                      <SelectItem value="quality_check">Quality Check</SelectItem>
                      <SelectItem value="ready_to_ship">Ready to Ship</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <div className="text-sm">
                  <div className="mb-1 text-muted-foreground">Payment</div>
                  {badgeForPayment(order.paymentStatus)}
                </div>
                <div className="text-sm">
                  <div className="mb-1 text-muted-foreground">Fulfillment</div>
                  {badgeForFulfillment(order.fulfillmentStatus)}
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Subtotal</div>
                  <div className="text-base font-medium">{formatCurrency(order.pricing.subtotal, order.pricing.currency)}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Shipping</div>
                  <div className="text-base font-medium">{formatCurrency(order.pricing.shipping, order.pricing.currency)}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Discount</div>
                  <div className="text-base font-medium">-{formatCurrency(order.pricing.discount, order.pricing.currency)}</div>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Tax</div>
                  <div className="text-base font-medium">{formatCurrency(order.pricing.tax, order.pricing.currency)}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="text-lg font-semibold">{formatCurrency(order.pricing.total, order.pricing.currency)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ITEMS */}
        <TabsContent value="items" className="mt-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle>Items</CardTitle>
              <CardDescription>Line items and customizations.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((it) => (
                      <TableRow key={it.id}>
                        <TableCell className="font-medium">{it.title}</TableCell>
                        <TableCell className="text-muted-foreground">{it.sku ?? "—"}</TableCell>
                        <TableCell>{it.quantity}</TableCell>
                        <TableCell>{formatCurrency(it.price, order.pricing.currency)}</TableCell>
                        <TableCell>{formatCurrency(it.totalPrice, order.pricing.currency)}</TableCell>
                      </TableRow>
                    ))}
                    {order.items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                          No items.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <Separator className="my-4" />
              <div className="text-sm text-muted-foreground">
                Panel customizations (first item example):{" "}
                {order.items[0]?.panelCustomization
                  ? Object.entries(order.items[0].panelCustomization).map(([panel, v]) => (
                      <Badge key={panel} variant="outline" className="mr-2">
                        {panel}: {v.materialName} / {v.colorName}
                      </Badge>
                    ))
                  : "—"}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MANUFACTURING */}
        <TabsContent value="manufacturing" className="mt-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle>Manufacturing</CardTitle>
              <CardDescription>Track production lifecycle.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Action
                  icon={<Play className="mr-2 size-4" />}
                  label="Start Production"
                  disabled={order.status !== "design_received"}
                  onClick={startProduction}
                />
                <Action
                  icon={<CheckCheck className="mr-2 size-4" />}
                  label="Mark Quality Check"
                  disabled={order.status !== "in_production"}
                  onClick={markQC}
                />
                <Action
                  icon={<PackageOpen className="mr-2 size-4" />}
                  label="Ready to Ship"
                  disabled={order.status !== "quality_check"}
                  onClick={markReadyToShip}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Estimated Production (days)">
                  <Input
                    type="number"
                    value={String(order.manufacturing.estimatedProductionTime ?? 0)}
                    onChange={(e) =>
                      patch({ manufacturing: { ...order.manufacturing, estimatedProductionTime: Number(e.target.value || 0) } })
                    }
                  />
                </Field>
                <Field label="Notes">
                  <Textarea
                    rows={3}
                    value={order.manufacturing.notes ?? ""}
                    onChange={(e) => patch({ manufacturing: { ...order.manufacturing, notes: e.target.value } })}
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Readonly label="Start">{order.manufacturing.productionStartDate?.slice(0, 16)?.replace("T", " ") ?? "—"}</Readonly>
                <Readonly label="QC">{order.manufacturing.qualityCheckDate?.slice(0, 16)?.replace("T", " ") ?? "—"}</Readonly>
                <Readonly label="End">{order.manufacturing.productionEndDate?.slice(0, 16)?.replace("T", " ") ?? "—"}</Readonly>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SHIPPING */}
        <TabsContent value="shipping" className="mt-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle>Shipping</CardTitle>
              <CardDescription>ShipRocket integration (fields only; wire to your API).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Readonly label="AWB">{order.shiprocket.awbNumber ?? "—"}</Readonly>
                <Readonly label="Courier">{order.shiprocket.courierName ?? "—"}</Readonly>
                <Readonly label="Status">{order.shiprocket.status ?? "pending"}</Readonly>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Readonly label="Tracking">
                  {order.shiprocket.trackingUrl ? (
                    <a className="text-primary underline" href={order.shiprocket.trackingUrl} target="_blank" rel="noreferrer">Open tracking</a>
                  ) : "—"}
                </Readonly>
                <Readonly label="Label">
                  {order.shiprocket.labelUrl ? (
                    <a className="text-primary underline" href={order.shiprocket.labelUrl} target="_blank" rel="noreferrer">Open label</a>
                  ) : "—"}
                </Readonly>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={markShipped} disabled={order.status !== "ready_to_ship"}>
                  <Truck className="mr-2 size-4" /> Mark Shipped
                </Button>
                <Button onClick={markDelivered} disabled={order.status !== "shipped"}>
                  <CheckCircle2 className="mr-2 size-4" /> Mark Delivered
                </Button>
              </div>

              <Separator />

              <div className="text-sm text-muted-foreground">
                Optional endpoints you may add:
                <ul className="list-disc pl-5">
                  <li><code>POST /api/orders/{`[id]`}/shiprocket/create</code> — create shipment</li>
                  <li><code>POST /api/orders/{`[id]`}/shiprocket/label</code> — get label URL</li>
                  <li><code>POST /api/orders/{`[id]`}/shiprocket/track</code> — refresh tracking</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Action({
  icon, label, onClick, disabled,
}: { icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <Button onClick={onClick} disabled={disabled} className="justify-start">
      {icon}{label}
    </Button>
  );
}

function Readonly({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}

function formatCurrency(cents: number, currency: Currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format((cents ?? 0) / 100);
  } catch {
    return `$${(cents ?? 0) / 100}`;
  }
}

function badgeForFulfillment(s: FulfillmentStatus) {
  const label = s.replaceAll("_", " ");
  const variant = s === "delivered" ? "default" : s === "unfulfilled" ? "secondary" : "outline";
  return <Badge variant={variant as any}>{label}</Badge>;
}

function badgeForPayment(s: PaymentStatus) {
  const variant = s === "paid" ? "default" : s === "pending" ? "secondary" : "outline";
  return <Badge variant={variant as any}>{s.replaceAll("_", " ")}</Badge>;
}
