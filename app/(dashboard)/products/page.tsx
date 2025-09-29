"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MoreHorizontal, Plus, Search, Trash2, Pencil, RefreshCw } from "lucide-react";

type Product = {
  id: string;
  productId: string;
  title: string;
  vendor?: string | null;
  price: number;
  currency: "USD" | "EUR" | "GBP";
  isActive: boolean;
  createdAt: string;
};

type ApiList<T> = {
  items: T[];
  total: number;
  limit: number;
};

// const FALLBACK: ApiList<Product> = {
//   items: [
//     {
//       id: "fake_1",
//       productId: "oxford-001",
//       title: "Premium Oxford Shoes",
//       vendor: "Italian Shoes Company",
//       price: 12999,
//       currency: "USD",
//       isActive: true,
//       createdAt: new Date().toISOString(),
//     },
//     {
//       id: "fake_2",
//       productId: "derby-002",
//       title: "Classic Derby",
//       vendor: "Italian Shoes Company",
//       price: 11999,
//       currency: "USD",
//       isActive: true,
//       createdAt: new Date().toISOString(),
//     },
//   ],
//   total: 2,
//   limit: 20,
// };

function formatCurrency(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents);
}

export default function ProductsPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<ApiList<Product>>({ items: [], total: 0, limit: 20 });
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [page, setPage] = useState<number>(Number(sp.get("page") ?? 1));
  const limit = 20;

  // debounce for search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const qParam = q.trim();

  const totalPages = useMemo(() => Math.max(1, Math.ceil((list?.total ?? 0) / (list?.limit ?? limit))), [list]);

  const fetchProducts = async (opts?: { q?: string; page?: number }) => {
    const qp = new URLSearchParams();
    qp.set("limit", String(limit));
    qp.set("page", String(opts?.page ?? page));
    if (opts?.q || qParam) qp.set("q", (opts?.q ?? qParam));
    try {
      setLoading(true);
      const res = await fetch(`/api/products?${qp.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as ApiList<Product>;
      setList(data);
    } catch (e) {
      // fall back to static data
      if (process.env.NODE_ENV !== "production") {
        console.warn("Products API failed, using fallback data:", e);
      }
      // setList(FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep URL in sync (q + page)
  useEffect(() => {
    const params = new URLSearchParams();
    if (qParam) params.set("q", qParam);
    if (page !== 1) params.set("page", String(page));
    router.replace(`/products${params.toString() ? `?${params}` : ""}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qParam, page]);

  // handlers
  const onSearchChange = (v: string) => {
    setQ(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchProducts({ q: v, page: 1 });
    }, 350);
  };

  const onRefresh = () => fetchProducts();

  const onDelete = async (id: string) => {
    const run = async () => {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Delete failed ${res.status}`);
      }
      toast.success("Product deleted");
      fetchProducts();
    };
    toast.promise(run(), {
      loading: "Deleting…",
      success: "Deleted",
      error: "Failed to delete",
    });
  };

  const onNext = () => {
    const next = Math.min(page + 1, totalPages);
    if (next !== page) {
      setPage(next);
      fetchProducts({ page: next });
    }
  };
  const onPrev = () => {
    const prev = Math.max(1, page - 1);
    if (prev !== page) {
      setPage(prev);
      fetchProducts({ page: prev });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">Manage catalog, options, and variants.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw className="mr-2 size-4" />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/products/new">
              <Plus className="mr-2 size-4" />
              New Product
            </Link>
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle>Catalog</CardTitle>
          <CardDescription>Search & paginate through products</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search by title or productId…"
                className="pl-8 md:w-[360px]"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[36px]"></TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Product ID</TableHead>
                  <TableHead className="hidden md:table-cell">Vendor</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[1%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.items.map((p) => (
                  <TableRow key={p.id} className={p.isActive ? "" : "opacity-70"}>
                    <TableCell className="text-muted-foreground">#</TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/products/${p.id}`} className="hover:underline">
                        {p.title}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{p.productId}</TableCell>
                    <TableCell className="hidden md:table-cell">{p.vendor ?? "—"}</TableCell>
                    <TableCell>{formatCurrency(p.price, p.currency)}</TableCell>
                    <TableCell>
                      {p.isActive ? (
                        <Badge className="uppercase">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="uppercase">
                          Draft
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <RowActions id={p.id} onDelete={onDelete} />
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && list.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                      No products found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer: pagination */}
          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              Page <span className="font-medium text-foreground">{page}</span> of{" "}
              <span className="font-medium text-foreground">{totalPages}</span> ·{" "}
              <span className="font-medium text-foreground">{list.total}</span> total
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onPrev} disabled={page <= 1 || loading}>
                Prev
              </Button>
              <Button variant="outline" size="sm" onClick={onNext} disabled={page >= totalPages || loading}>
                Next
              </Button>
            </div>
          </div>

          {loading && (
            <>
              <Separator className="my-4" />
              <div className="text-xs text-muted-foreground">Loading…</div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RowActions({ id, onDelete }: { id: string; onDelete: (id: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="size-8">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/products/${id}`}>
            <Pencil className="mr-2 size-4" />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive cursor-pointer"
          onClick={() => onDelete(id)}
        >
          <Trash2 className="mr-2 size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
