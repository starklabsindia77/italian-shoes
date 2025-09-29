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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ArrowLeft, RefreshCcw, Save } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

type CustomerItem = {
  id: string;
  customerId?: string | null;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  isGuest: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type OrderLite = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  currency: "USD" | "EUR" | "GBP";
  createdAt?: string;
};

const FALLBACK_CUSTOMER: CustomerItem = {
  id: "cust_001",
  customerId: "CUST-001",
  email: "maria.rossi@example.com",
  firstName: "Maria",
  lastName: "Rossi",
  phone: "+39 331 555 1234",
  isGuest: false,
};

const FALLBACK_ORDERS: OrderLite[] = [
  { id: "ord_1001", orderNumber: "1001", status: "delivered", total: 19999, currency: "USD" },
  { id: "ord_1002", orderNumber: "1002", status: "in_production", total: 12999, currency: "USD" },
];

export default function CustomerEditPage() {
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [customer, setCustomer] = React.useState<CustomerItem | null>(null);
  const [orders, setOrders] = React.useState<OrderLite[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/customers/${id}`, { cache: "no-store" });
      if (!r.ok) throw new Error();
      const data = (await r.json()) as CustomerItem;
      setCustomer(data ?? FALLBACK_CUSTOMER);
    } catch {
      setCustomer(FALLBACK_CUSTOMER);
    }

    // optional orders list
    try {
      const r2 = await fetch(`/api/orders?customerId=${id}`, { cache: "no-store" });
      if (r2.ok) {
        const d2 = await r2.json();
        setOrders(d2.items ?? d2 ?? FALLBACK_ORDERS);
      } else {
        setOrders(FALLBACK_ORDERS);
      }
    } catch {
      setOrders(FALLBACK_ORDERS);
    }

    setLoading(false);
  };

  React.useEffect(() => { if (id) load(); /* eslint-disable-next-line */ }, [id]);

  const save = async () => {
    if (!customer) return;
    setSaving(true);
    const run = async () => {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "PUT",
        body: JSON.stringify({
          email: customer.email,
          firstName: customer.firstName ?? null,
          lastName: customer.lastName ?? null,
          phone: customer.phone ?? null,
          isGuest: customer.isGuest,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    };
    const p = run();
    toast.promise(p, { loading: "Saving…", success: "Saved", error: "Failed to save" });
    await p;
    setSaving(false);
  };

  if (!customer) return null;

  const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "—";

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/customers"><ArrowLeft className="mr-2 size-4" />Back</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{fullName}</h1>
            <p className="text-sm text-muted-foreground">{customer.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load}><RefreshCcw className="mr-2 size-4" />Refresh</Button>
          <Button onClick={save} disabled={saving}><Save className="mr-2 size-4" />Save</Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="mt-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle>Details</CardTitle>
              <CardDescription>Contact information and account type.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <Field label="Email">
                <Input
                  type="email"
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                />
              </Field>
              <Field label="Phone (optional)">
                <Input
                  value={customer.phone ?? ""}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                />
              </Field>
              <Field label="First Name (optional)">
                <Input
                  value={customer.firstName ?? ""}
                  onChange={(e) => setCustomer({ ...customer, firstName: e.target.value })}
                />
              </Field>
              <Field label="Last Name (optional)">
                <Input
                  value={customer.lastName ?? ""}
                  onChange={(e) => setCustomer({ ...customer, lastName: e.target.value })}
                />
              </Field>
              <div className="md:col-span-2">
                {customer.isGuest ? (
                  <Badge variant="secondary">Guest</Badge>
                ) : (
                  <Badge>Registered</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ADDRESSES (UI stub — wire to /api/customers/[id]/addresses if you add it) */}
        <TabsContent value="addresses" className="mt-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle>Addresses</CardTitle>
              <CardDescription>Billing & shipping addresses (UI stub).</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Wire this tab to <code>/api/customers/{`[id]`}/addresses</code> if/when you add address CRUD.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ORDERS */}
        <TabsContent value="orders" className="mt-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle>Orders</CardTitle>
              <CardDescription>Recent orders for this customer.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-medium">{o.orderNumber}</TableCell>
                        <TableCell className="text-muted-foreground">{o.status}</TableCell>
                        <TableCell>{formatCurrency(o.total, o.currency)}</TableCell>
                        <TableCell className="text-muted-foreground">{o.createdAt?.slice(0, 10) ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                    {orders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                          No orders yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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

function formatCurrency(cents: number, currency: "USD" | "EUR" | "GBP" = "USD") {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format((cents ?? 0) / 100);
  } catch {
    return `$${(cents ?? 0) / 100}`;
  }
}
