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
  Trash2,
} from "lucide-react";

type PanelGroup = "FRONT" | "SIDE" | "BACK" | "TOP" | "SOLE" | "LINING";

type PanelItem = {
  id: string;
  panelId: string;
  name: string;
  group: PanelGroup;
  description?: string | null;
  position: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  _productsCount?: number;
};

export default function PanelsListPage() {
  const [items, setItems] = React.useState<PanelItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [sortAsc, setSortAsc] = React.useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/panels?limit=300${
          query ? `&q=${encodeURIComponent(query)}` : ""
        }`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setItems((data.items ?? data ?? []) as PanelItem[]);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, []);

  const toggleActive = async (p: PanelItem) => {
    setItems((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, isActive: !x.isActive } : x))
    );
    try {
      const req = fetch(`/api/panels/${p.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      toast.promise(req, {
        loading: "Updating…",
        success: "Updated",
        error: "Failed to update",
      });
      await req;
    } catch {
      setItems((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, isActive: p.isActive } : x))
      );
    }
  };

  const deletePanel = async (p: PanelItem) => {
    // Remove item optimistically
    setItems((prev) => prev.filter((x) => x.id !== p.id));

    try {
      const res = await fetch(`/api/panels/${p.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Panel deleted successfully");
    } catch (err) {
      toast.error("Failed to delete panel");
      // Revert UI if deletion fails
      setItems((prev) => [...prev, p]);
    }
  };

  const sorted = React.useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) =>
      sortAsc ? a.position - b.position : b.position - a.position
    );
    return copy;
  }, [items, sortAsc]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Panels</h1>
          <p className="text-sm text-muted-foreground">
            Manage customizable shoe panels.
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
            <Link href="/panels/new">
              <Plus className="mr-2 size-4" />
              New Panel
            </Link>
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle>All Panels</CardTitle>
          <CardDescription>
            Search, toggle status, edit, and delete.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search panels…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") load();
              }}
            />
            <Button onClick={load}>Search</Button>
            <Button variant="outline" onClick={() => setSortAsc((v) => !v)}>
              <ArrowUpDown className="mr-2 size-4" />
              {sortAsc ? "Sort Desc" : "Sort Asc"}
            </Button>
          </div>

          <Separator />

          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-0"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.group}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.panelId}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.position}
                    </TableCell>
                    <TableCell>
                      {p.isActive ? (
                        <Badge>Active</Badge>
                      ) : (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleActive(p)}
                      >
                        {p.isActive ? (
                          <ToggleLeft className="mr-2 size-4" />
                        ) : (
                          <ToggleRight className="mr-2 size-4" />
                        )}
                        {p.isActive ? "Disable" : "Enable"}
                      </Button>
                      <Button size="sm" asChild>
                        <Link href={`/panels/${p.id}`}>
                          <Edit3 className="mr-2 size-4" />
                          Edit
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deletePanel(p)}
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
                      No panels found.
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
