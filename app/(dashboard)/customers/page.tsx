"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RefreshCcw, Plus, Edit3 } from "lucide-react";

type CustomerItem = {
  id: string;
  customerId?: string | null; // public readable id/slug
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  isGuest: boolean;
  createdAt?: string;
  updatedAt?: string;
  _ordersCount?: number; // optional if your API returns it
};

const FALLBACK: CustomerItem[] = [
  {
    id: "cust_001",
    customerId: "CUST-001",
    email: "maria.rossi@example.com",
    firstName: "Maria",
    lastName: "Rossi",
    phone: "+39 331 555 1234",
    isGuest: false,
    _ordersCount: 3,
  },
  {
    id: "cust_guest_1",
    email: "guest@example.com",
    firstName: null,
    lastName: null,
    phone: null,
    isGuest: true,
    _ordersCount: 1,
  },
];

export default function CustomersListPage() {
  const [items, setItems] = React.useState<CustomerItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/customers?limit=100${
          query ? `&q=${encodeURIComponent(query)}` : ""
        }`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setItems((data.items ?? data ?? []) as CustomerItem[]);
    } catch {
      setItems(FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Manage registered and guest customers.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCcw
              className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`}
            />
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
          <Button asChild>
            <Link href="/customers/new">
              <Plus className="mr-2 size-4" />
              New Customer
            </Link>
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle>All Customers</CardTitle>
          <CardDescription>
            Search and edit customers. Use the search box for email, name, or
            phone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search customers by email, name, phone…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") load();
              }}
            />
            <Button onClick={load}>Search</Button>
          </div>

          <Separator />

          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead className="w-0"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((c) => {
                  const name =
                    [c.firstName, c.lastName].filter(Boolean).join(" ") || "—";
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.email}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.phone ?? "—"}
                      </TableCell>
                      <TableCell>
                        {c.isGuest ? (
                          <Badge variant="secondary">Guest</Badge>
                        ) : (
                          <Badge>Registered</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {typeof c._ordersCount === "number"
                          ? c._ordersCount
                          : "—"}
                      </TableCell>
                      <TableCell className="flex justify-end">
                        <Button size="sm" asChild>
                          <Link href={`/customers/${c.id}`}>
                            <Edit3 className="mr-2 size-4" />
                            Edit
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {items.length === 0 && !loading && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-6 text-center text-sm text-muted-foreground"
                    >
                      No customers found.
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
