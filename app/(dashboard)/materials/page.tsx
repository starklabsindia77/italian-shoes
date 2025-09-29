"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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
import { RefreshCcw, Plus, Edit3, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";

type Material = {
  id: string;
  materialId?: string | null;
  name: string;
  description?: string | null;
  category: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  _colorsCount?: number;
};

const FALLBACK: Material[] = [
  { id: "mat_leather", name: "Leather", category: "leather", isActive: true, description: "Full-grain", _colorsCount: 5 },
  { id: "mat_suede", name: "Suede", category: "suede", isActive: true, description: "Soft touch", _colorsCount: 2 },
];

export default function MaterialsListPage() {
  const [items, setItems] = React.useState<Material[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const router = useRouter();

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/materials?limit=100${query ? `&q=${encodeURIComponent(query)}` : ""}`, { cache: "no-store" });
      const data = await res.json();
      setItems(data.items ?? data ?? []);
    } catch {
      setItems(FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const toggleActive = async (m: Material) => {
    setItems(prev => prev.map(x => x.id === m.id ? { ...x, isActive: !x.isActive } : x));
    try {
      const res = await fetch(`/api/materials/${m.id}`, { method: "PUT", body: JSON.stringify({ isActive: !m.isActive }) });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Status updated");
    } catch {
      setItems(prev => prev.map(x => x.id === m.id ? { ...x, isActive: m.isActive } : x));
      toast.error("Failed to update status");
    }
  };

  // Delete material
  const deleteMaterial = async (m: Material) => {
    // Optimistically remove from UI
    setItems(prev => prev.filter(x => x.id !== m.id));

    try {
      const res = await fetch(`/api/materials/${m.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Material deleted successfully");
    } catch (err) {
      toast.error("Failed to delete material");
      // Revert UI if deletion fails
      setItems(prev => [...prev, m]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Materials</h1>
          <p className="text-sm text-muted-foreground">Manage material families and their color variants.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCcw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
          <Button asChild>
            <Link href="/materials/new"><Plus className="mr-2 size-4" />New Material</Link>
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle>All Materials</CardTitle>
          <CardDescription>Search, toggle status, edit, or delete.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search materials…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") load(); }}
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
                  <TableHead>Colors</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-0"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="text-muted-foreground">{m.category}</TableCell>
                    <TableCell>{typeof m._colorsCount === "number" ? m._colorsCount : "—"}</TableCell>
                    <TableCell>{m.isActive ? <Badge>Active</Badge> : <Badge variant="secondary">Disabled</Badge>}</TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => toggleActive(m)}>
                        {m.isActive ? <ToggleLeft className="mr-2 size-4" /> : <ToggleRight className="mr-2 size-4" />}
                        {m.isActive ? "Disable" : "Enable"}
                      </Button>
                      <Button size="sm" asChild>
                        <Link href={`/materials/${m.id}`}><Edit3 className="mr-2 size-4" />Edit</Link>
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteMaterial(m)} className="cursor-pointer text-white">
                        <Trash2 className="mr-2 size-4" />Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                      No materials found.
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
