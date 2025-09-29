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
  Trash2,
} from "lucide-react";

type SoleModelConfig = {
  glbUrl?: string | null;
  lighting?: string | null;
  environment?: string | null;
};

type SoleItem = {
  id: string;
  soleId?: string | null;
  name: string;
  description?: string | null;
  category: string;
  imageUrl?: string | null;
  isActive: boolean;
  modelConfig?: SoleModelConfig | null;
  createdAt?: string;
  updatedAt?: string;
  _productsCount?: number;
};

const FALLBACK: SoleItem[] = [
  {
    id: "sole_01",
    soleId: "sole-01",
    name: "Sole 01",
    category: "rubber",
    description: "Durable rubber sole",
    imageUrl: "/images/soles/sole-01.png",
    isActive: true,
    modelConfig: {
      glbUrl: "/glb/soles/sole-01.glb",
      lighting: "directional",
      environment: "studio",
    },
    _productsCount: 4,
  },
];

export default function SolesListPage() {
  const [items, setItems] = React.useState<SoleItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/soles?limit=100${query ? `&q=${encodeURIComponent(query)}` : ""}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setItems(data.items ?? data ?? []);
    } catch {
      setItems(FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, []);

  const toggleActive = async (s: SoleItem) => {
    setItems((prev) =>
      prev.map((x) => (x.id === s.id ? { ...x, isActive: !x.isActive } : x))
    );
    try {
      const run = async () => {
        const res = await fetch(`/api/soles/${s.id}`, {
          method: "PUT",
          body: JSON.stringify({ isActive: !s.isActive }),
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      };
      const p = run();
      toast.promise(p, {
        loading: "Updating…",
        success: "Updated",
        error: "Failed to update",
      });
      await p;
    } catch {
      setItems((prev) =>
        prev.map((x) => (x.id === s.id ? { ...x, isActive: s.isActive } : x))
      );
    }
  };

  const deleteSole = async (s: SoleItem) => {
    // Optimistically remove from UI
    setItems((prev) => prev.filter((x) => x.id !== s.id));

    try {
      const res = await fetch(`/api/soles/${s.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Sole deleted successfully");
    } catch (err) {
      toast.error("Failed to delete sole");
      // Revert UI if deletion fails
      setItems((prev) => [...prev, s]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Soles</h1>
          <p className="text-sm text-muted-foreground">
            Manage available soles and their 3D configs.
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
            <Link href="/soles/new">
              <Plus className="mr-2 size-4" />
              New Sole
            </Link>
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle>All Soles</CardTitle>
          <CardDescription>
            Search, toggle status, edit, or delete.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search soles…"
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
                  <TableHead>Category</TableHead>
                  <TableHead>GLB</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-0"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.category}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.modelConfig?.glbUrl ? "Yes" : "—"}
                    </TableCell>
                    <TableCell>
                      {typeof s._productsCount === "number"
                        ? s._productsCount
                        : "—"}
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
                        <Link href={`/soles/${s.id}`}>
                          <Edit3 className="mr-2 size-4" />
                          Edit
                        </Link>
                      </Button>

                      {/* Delete button */}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteSole(s)}
                        className="cursor-pointer text-white"
                      >
                        <Trash2 className="mr-2 size-4" />
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && !loading && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-6 text-center text-sm text-muted-foreground"
                    >
                      No soles found.
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
