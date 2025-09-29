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
import {
  RefreshCcw,
  Plus,
  Edit3,
  ToggleLeft,
  ToggleRight,
  ArrowUpDown,
} from "lucide-react";

type Region = "US" | "EU" | "UK";

type SizeItem = {
  id: string;
  sizeId: string;
  name: string;
  region: Region;
  value: number;
  euEquivalent?: string | null;
  ukEquivalent?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const FALLBACK: SizeItem[] = [
  {
    id: "size_us8",
    sizeId: "us-8",
    name: "US 8",
    region: "US",
    value: 8,
    euEquivalent: "EU 41",
    ukEquivalent: "UK 7",
    isActive: true,
    sortOrder: 80,
  },
  {
    id: "size_us9",
    sizeId: "us-9",
    name: "US 9",
    region: "US",
    value: 9,
    euEquivalent: "EU 42",
    ukEquivalent: "UK 8",
    isActive: true,
    sortOrder: 90,
  },
];

export default function SizesListPage() {
  const [items, setItems] = React.useState<SizeItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [sortAsc, setSortAsc] = React.useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/sizes?limit=300${query ? `&q=${encodeURIComponent(query)}` : ""}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setItems((data.items ?? data ?? []) as SizeItem[]);
    } catch {
      setItems(FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, []);

  const toggleActive = async (s: SizeItem) => {
    setItems((prev) =>
      prev.map((x) => (x.id === s.id ? { ...x, isActive: !x.isActive } : x))
    );
    try {
      const req = fetch(`/api/sizes/${s.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !s.isActive }),
      });
      toast.promise(req, {
        loading: "Updating…",
        success: "Updated",
        error: "Failed to update",
      });
      await req;
    } catch {
      setItems((prev) =>
        prev.map((x) => (x.id === s.id ? { ...x, isActive: s.isActive } : x))
      );
    }
  };

  // ✅ Implement delete function inside the component
  const deleteSize = async (s: SizeItem) => {
    // Optimistic UI update
    setItems((prev) => prev.filter((x) => x.id !== s.id));

    try {
      const req = fetch(`/api/sizes/${s.id}`, { method: "DELETE" }).then(
        async (r) => {
          if (!r.ok) throw new Error(await r.text());
          return r.json();
        }
      );

      toast.promise(req, {
        loading: "Deleting…",
        success: "Deleted",
        error: "Failed to delete",
      });

      await req;
    } catch {
      // Rollback if delete failed
      setItems((prev) => [...prev, s]);
    }
  };

  const sorted = React.useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) =>
      sortAsc ? a.sortOrder - b.sortOrder : b.sortOrder - a.sortOrder
    );
    return copy;
  }, [items, sortAsc]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sizes</h1>
          <p className="text-sm text-muted-foreground">
            Manage global size list used by all products.
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
            <Link href="/sizes/new">
              <Plus className="mr-2 size-4" />
              New Size
            </Link>
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle>All Sizes</CardTitle>
          <CardDescription>
            Search, toggle status, edit, delete, and reorder.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search by name/region (e.g., US 8, EU 41)…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") load();
              }}
            />
            <Button onClick={load}>Search</Button>
            <Button variant="outline" onClick={() => setSortAsc((s) => !s)}>
              <ArrowUpDown className="mr-2 size-4" />
              Sort {sortAsc ? "Asc" : "Desc"}
            </Button>
          </div>

          <Separator />

          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Region</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>EU</TableHead>
                  <TableHead>UK</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-0"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.region}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.value}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.euEquivalent ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.ukEquivalent ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.sortOrder}
                    </TableCell>
                    <TableCell>
                      {s.isActive ? (
                        <Badge>Active</Badge>
                      ) : (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleActive(s)}
                      >
                        {s.isActive ? (
                          <ToggleLeft className="mr-2 size-4" />
                        ) : (
                          <ToggleRight className="mr-2 size-4" />
                        )}
                        {s.isActive ? "Disable" : "Enable"}
                      </Button>
                      <Button size="sm" asChild>
                        <Link href={`/sizes/${s.id}`}>
                          <Edit3 className="mr-2 size-4" />
                          Edit
                        </Link>
                      </Button>
                      {/* ✅ Delete button */}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteSize(s)}
                        className="cursor-pointer text-white"
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && !loading && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-6 text-center text-sm text-muted-foreground"
                    >
                      No sizes found.
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
