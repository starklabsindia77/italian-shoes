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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getAssetUrl } from "@/lib/utils";
import { ArrowLeft, RefreshCcw, Save, Play, CheckCheck, PackageOpen, Truck, CheckCircle2, ShoppingCart, ArrowRight } from "lucide-react";

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
  productTitle: string;
  title?: string;
  sku?: string | null;
  quantity: number;
  price: number;
  totalPrice: number;
  designThumbnail?: string | null;
  style?: { styleId: string; styleName: string } | null;
  sole?: { soleId: string; soleName: string } | null;
  size?: { sizeId: string; sizeName: string } | null;
  panelCustomization?: any;
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
      productTitle: "Premium Oxford Shoes",
      title: "Premium Oxford Shoes",
      sku: "SKU-AB12CD34",
      quantity: 1,
      price: 19999,
      totalPrice: 19999,
      designThumbnail: null,
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
  const [selectedItem, setSelectedItem] = React.useState<OrderItem | null>(null);
  const [zoomedImage, setZoomedImage] = React.useState<{ url: string; title: string } | null>(null);
  const [localManufacturing, setLocalManufacturing] = React.useState<ManufacturingInfo | null>(null);
  const [localShipping, setLocalShipping] = React.useState<ShippingInfo | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/orders/${id}`, { cache: "no-store" });
      if (!r.ok) throw new Error();
      const data = (await r.json()) as OrderFull;
      setOrder(data ?? FALLBACK_ORDER);
      setLocalManufacturing((data ?? FALLBACK_ORDER).manufacturing);
      setLocalShipping((data ?? FALLBACK_ORDER).shiprocket);
    } catch {
      setOrder(FALLBACK_ORDER);
      setLocalManufacturing(FALLBACK_ORDER.manufacturing);
      setLocalShipping(FALLBACK_ORDER.shiprocket);
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
    patch({
      status: "in_production", fulfillmentStatus: "in_production",
      manufacturing: { ...order!.manufacturing, productionStartDate: new Date().toISOString() }
    });

  const markQC = () =>
    patch({ status: "quality_check", manufacturing: { ...order!.manufacturing, qualityCheckDate: new Date().toISOString() } });

  const markReadyToShip = () =>
    patch({
      status: "ready_to_ship",
      fulfillmentStatus: "ready_to_ship",
      manufacturing: { ...order!.manufacturing, productionEndDate: new Date().toISOString() }
    });

  const markShipped = () =>
    patch({ status: "shipped", fulfillmentStatus: "shipped" });

  const markDelivered = () =>
    patch({
      status: "delivered", fulfillmentStatus: "delivered",
      shiprocket: { ...order!.shiprocket, status: "delivered", actualDelivery: new Date().toISOString() }
    });

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
          <Button disabled={saving} onClick={() => patch({ 
            manufacturing: localManufacturing || undefined,
            shiprocket: localShipping || undefined
          })}><Save className="mr-2 size-4" />Save</Button>
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
              {/* Order & Payment Status */}
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

              {/* Customer Info */}
              <div className="grid gap-3 p-4 rounded-xl border bg-muted/20">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Customer Information</div>
                <div>
                  <div className="font-semibold text-sm">{customerName}</div>
                  <div className="text-sm text-muted-foreground">{order.customer.email}</div>
                  <div className="text-sm text-muted-foreground">{order.customer.phone || "No phone provided"}</div>
                  <div className="mt-2">
                    {order.customer.isGuest ? (
                      <Badge variant="secondary" className="text-[10px]">Guest Checkout</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">Registered User</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="grid gap-3 p-4 rounded-xl border bg-muted/20">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex justify-between items-center">
                  <span>Shipping Address</span>
                </div>
                {renderAddress(order.shipping, customerName)}
              </div>

              {/* Billing Address */}
              <div className="grid gap-3 p-4 rounded-xl border bg-muted/20">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Billing Address</div>
                {renderAddress(order.billing, customerName)}
              </div>

              {/* Pricing Summary */}
              <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Subtotal</div>
                  <div className="text-base font-medium">{formatCurrency(order.pricing.subtotal, order.pricing.currency)}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Shipping</div>
                  <div className="text-base font-medium">{formatCurrency(order.pricing.shipping, order.pricing.currency)}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Tax</div>
                  <div className="text-base font-medium">{formatCurrency(order.pricing.tax, order.pricing.currency)}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Discount</div>
                  <div className="text-base font-medium text-destructive">-{formatCurrency(order.pricing.discount, order.pricing.currency)}</div>
                </div>
                <div className="rounded-lg border p-3 bg-primary/5 border-primary/20">
                  <div className="text-xs text-primary font-bold uppercase tracking-tight">Total</div>
                  <div className="text-xl font-bold text-primary">{formatCurrency(order.pricing.total, order.pricing.currency)}</div>
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
                      <TableHead className="w-[80px]">Image</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((it) => (
                      <React.Fragment key={it.id}>
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setSelectedItem(it)}
                        >
                          <TableCell className="align-top">
                            {it.designThumbnail ? (
                              <div className="relative aspect-square w-16 overflow-hidden rounded-lg border bg-muted group-hover:opacity-80 transition-opacity">
                                <img src={getAssetUrl(it.designThumbnail)} alt={it.productTitle} className="object-cover w-full h-full" />
                              </div>
                            ) : (
                              <div className="flex aspect-square w-16 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                                <ShoppingCart className="size-6 opacity-20" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium align-top">
                            <span className="text-base">{it.productTitle || it.title || "Untitled Product"}</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {it.style && <Badge variant="secondary" className="text-[10px]">{it.style.styleName}</Badge>}
                              {it.sole && <Badge variant="secondary" className="text-[10px]">{it.sole.soleName}</Badge>}
                              {it.size && <Badge variant="secondary" className="text-[10px]">{it.size.sizeName}</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground align-top">{it.sku ?? "—"}</TableCell>
                          <TableCell className="align-top font-medium">{it.quantity}</TableCell>
                          <TableCell className="align-top">{formatCurrency(it.price, order.pricing.currency)}</TableCell>
                          <TableCell className="align-top font-semibold">{formatCurrency(it.totalPrice, order.pricing.currency)}</TableCell>
                        </TableRow>
                        {it.panelCustomization && Object.keys(it.panelCustomization).length > 0 && (
                          <TableRow className="bg-slate-50/50 border-t-0 hover:bg-slate-50/50">
                            <TableCell colSpan={6} className="py-3 pl-12">
                              <div className="flex flex-wrap gap-3 items-start">
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Detailed Configuration</span>
                                  <div className="flex flex-wrap gap-2">
                                    {Object.entries(it.panelCustomization).map(([panel, v]: [string, any]) => {
                                      const label = panel.replace(/_/g, " ").replace(/-/g, " ");
                                      const material = v.materialName || v.material || "N/A";
                                      const color = v.colorName || v.color || "N/A";

                                      return (
                                        <div key={panel} className="flex items-center gap-2 border border-slate-200 rounded-lg p-1.5 bg-white shadow-sm min-w-[140px]">
                                          <div className="size-8 rounded-md border shrink-0 overflow-hidden bg-slate-50">
                                            {v.colorUrl ? (
                                              <img src={getAssetUrl(v.colorUrl)} alt={v.colorName} className="object-cover w-full h-full" />
                                            ) : (
                                              <div className="flex items-center justify-center w-full h-full text-[8px] text-slate-300">N/A</div>
                                            )}
                                          </div>
                                          <div className="flex flex-col min-w-0">
                                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tight mb-0.5 border-b border-slate-100 pb-0.5 truncate">{label}</span>
                                            <div className="flex flex-col">
                                              <span className="text-[10px] font-bold text-slate-800 leading-tight truncate">{color}</span>
                                              <span className="text-[9px] text-slate-500 font-medium leading-tight truncate">{material}</span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
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
                    value={String(localManufacturing?.estimatedProductionTime ?? 0)}
                    onChange={(e) =>
                      setLocalManufacturing(prev => prev ? ({ ...prev, estimatedProductionTime: Number(e.target.value || 0) }) : null)
                    }
                  />
                </Field>
                <Field label="Notes">
                  <Textarea
                    rows={3}
                    value={localManufacturing?.notes ?? ""}
                    onChange={(e) => setLocalManufacturing(prev => prev ? ({ ...prev, notes: e.target.value }) : null)}
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
              <CardTitle>Shipping Details</CardTitle>
              <CardDescription>Manage tracking information for any delivery partner.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Courier Name">
                  <Input 
                    placeholder="e.g. BlueDart, DHL, Delhivery"
                    value={localShipping?.courierName ?? ""}
                    onChange={(e) => setLocalShipping(prev => prev ? ({ ...prev, courierName: e.target.value }) : null)}
                  />
                </Field>
                <Field label="AWB / Tracking Number">
                  <Input 
                    placeholder="Enter Tracking ID"
                    value={localShipping?.awbNumber ?? ""}
                    onChange={(e) => setLocalShipping(prev => prev ? ({ ...prev, awbNumber: e.target.value }) : null)}
                  />
                </Field>
                <Field label="Status">
                   <Select 
                    value={localShipping?.status ?? "pending"} 
                    onValueChange={(v: any) => setLocalShipping(prev => prev ? ({ ...prev, status: v }) : null)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="picked_up">Picked Up</SelectItem>
                      <SelectItem value="in_transit">In Transit</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-1">
                <Field label="Tracking URL">
                  <Input 
                    placeholder="https://tracker.courier.com/..."
                    value={localShipping?.trackingUrl ?? ""}
                    onChange={(e) => setLocalShipping(prev => prev ? ({ ...prev, trackingUrl: e.target.value }) : null)}
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Readonly label="Tracking Link">
                  {localShipping?.trackingUrl ? (
                    <a className="text-primary font-medium underline flex items-center gap-1" href={localShipping.trackingUrl} target="_blank" rel="noreferrer">
                      Test Link <ArrowRight className="size-3" />
                    </a>
                  ) : "No URL provided"}
                </Readonly>
                <Readonly label="Label Link">
                  {localShipping?.labelUrl ? (
                    <a className="text-primary font-medium underline" href={localShipping.labelUrl} target="_blank" rel="noreferrer">Download Shipping Label</a>
                  ) : "No label generated"}
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

      {/* Item Detail Modal */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-2xl font-bold">{selectedItem?.productTitle || selectedItem?.title}</DialogTitle>
            <DialogDescription>Full customization and design details for this item.</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-8 md:grid-cols-2">
            {/* Left: Design Image */}
            <div className="space-y-4">
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl border bg-slate-50 shadow-inner">
                {selectedItem?.designThumbnail ? (
                  <img 
                    src={getAssetUrl(selectedItem.designThumbnail)} 
                    alt={selectedItem.productTitle} 
                    className="object-contain w-full h-full p-4"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                    <ShoppingCart className="size-20 opacity-10" />
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 justify-center">
                {selectedItem?.style && <Badge variant="outline" className="px-3 py-1">Style: {selectedItem.style.styleName}</Badge>}
                {selectedItem?.sole && <Badge variant="outline" className="px-3 py-1">Sole: {selectedItem.sole.soleName}</Badge>}
                {selectedItem?.size && <Badge variant="outline" className="px-3 py-1">Size: {selectedItem.size.sizeName}</Badge>}
              </div>

              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 italic text-sm text-slate-600">
                Large design preview captured at time of order.
              </div>
            </div>

            {/* Right: Detailed Configuration */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Panel Configuration</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedItem?.panelCustomization && Object.entries(selectedItem.panelCustomization).map(([panel, v]: [string, any]) => (
                    <div 
                      key={panel} 
                      className="flex gap-4 border border-slate-200 rounded-xl p-3 bg-white hover:bg-slate-50 transition-colors shadow-sm items-center cursor-zoom-in group/swatch"
                      onClick={() => v.colorUrl && setZoomedImage({ url: v.colorUrl, title: `${panel.replace(/_/g, " ")}: ${v.colorName || v.color}` })}
                    >
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border bg-slate-50 shadow-sm group-hover/swatch:ring-2 group-hover/swatch:ring-primary/20 transition-all">
                        {v.colorUrl ? (
                          <img 
                            src={getAssetUrl(v.colorUrl)} 
                            alt={v.colorName} 
                            className="object-cover w-full h-full" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/placeholder/material.jpg";
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full bg-slate-100 text-[10px] text-slate-400 uppercase font-bold text-center p-1">No Image</div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                          {panel.replace(/_/g, " ").replace(/-/g, " ")}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 leading-tight truncate">{v.colorName || v.color || "N/A"}</span>
                          <span className="text-[11px] text-slate-500 font-medium leading-tight truncate mt-0.5">{v.materialName || v.material || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!selectedItem?.panelCustomization || Object.keys(selectedItem.panelCustomization).length === 0) && (
                    <div className="col-span-2 py-4 text-center text-sm text-muted-foreground bg-muted/50 rounded-xl">
                      No panel customizations found for this item.
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border p-3 bg-slate-50/50">
                  <div className="text-xs text-muted-foreground mb-1">Unit Price</div>
                  <div className="text-lg font-bold">{formatCurrency(selectedItem?.price ?? 0, order.pricing.currency)}</div>
                </div>
                <div className="rounded-xl border p-3 bg-slate-50/50">
                  <div className="text-xs text-muted-foreground mb-1">Quantity</div>
                  <div className="text-lg font-bold">x {selectedItem?.quantity}</div>
                </div>
                <div className="col-span-2 rounded-xl border p-4 bg-primary/5 border-primary/10">
                  <div className="text-xs text-primary/60 font-bold uppercase tracking-widest mb-1">Subtotal</div>
                  <div className="text-2xl font-black text-primary">{formatCurrency(selectedItem?.totalPrice ?? 0, order.pricing.currency)}</div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Swatch Zoom Dialog */}
      <Dialog open={!!zoomedImage} onOpenChange={(open) => !open && setZoomedImage(null)}>
        <DialogContent className="max-w-2xl bg-white border-none shadow-2xl p-0 overflow-hidden rounded-3xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{zoomedImage?.title || "Material Preview"}</DialogTitle>
            <DialogDescription>High-resolution material texture preview</DialogDescription>
          </DialogHeader>
          <div className="relative aspect-square w-full bg-slate-100">
            {zoomedImage && (
              <img 
                src={getAssetUrl(zoomedImage.url)} 
                alt={zoomedImage.title} 
                className="object-cover w-full h-full"
              />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-8">
              <h3 className="text-xl font-bold text-white">{zoomedImage?.title}</h3>
              <p className="text-white/80 text-sm mt-1">High-resolution material texture preview</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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

function formatCurrency(amount: number, currency: Currency | string = "USD") {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0
    }).format(amount ?? 0);
  } catch {
    return `${currency} ${amount ?? 0}`;
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

function renderAddress(addr: any, fallbackName: string) {
  if (!addr) return <div className="text-sm text-muted-foreground italic">No address provided</div>;

  const name = addr.name || addr.firstName || fallbackName;
  const street = addr.street || addr.address1 || addr.line1;
  const apartment = addr.apartment || addr.address2 || addr.line2;
  const landmark = addr.landmark || addr.near;
  const city = addr.city;
  const state = addr.state || addr.province || addr.region;
  const zip = addr.zip || addr.postal_code || addr.pincode;
  const country = addr.country;
  const phone = addr.phone || addr.contact;

  return (
    <div className="text-sm space-y-0.5">
      <div className="font-semibold text-slate-800">{name}</div>
      <div className="text-slate-600">{street}</div>
      {apartment && <div className="text-slate-600">{apartment}</div>}
      {landmark && <div className="text-slate-500 italic text-xs">Landmark: {landmark}</div>}
      <div className="text-slate-600">
        {city}{state ? `, ${state}` : ""} {zip ? ` - ${zip}` : ""}
      </div>
      <div className="font-bold uppercase tracking-widest text-[10px] text-slate-400 mt-1">{country}</div>
      {phone && <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 font-medium">PH: {phone}</div>}
    </div>
  );
}
