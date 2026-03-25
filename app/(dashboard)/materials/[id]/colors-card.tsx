"use client";
import * as React from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, PaintBucket, Upload } from "lucide-react";
import { getAssetUrl } from "@/lib/utils";

type MaterialColor = {
  id: string;
  name: string;
  imageUrl?: string | null;
  isActive: boolean;
  sortOrder?: number | null;
};

export function ColorsCard({ materialId }: { materialId: string }) {
  const [items, setItems] = React.useState<MaterialColor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);

  const [name, setName] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [active, setActive] = React.useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/materials/${materialId}/colors`, { cache: "no-store" });
      const d = await r.json();
      setItems(d.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); /* eslint-disable-next-line */ }, [materialId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/assets/upload?folder=colors`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setImageUrl(data.url);
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const add = async () => {
    if (!name.trim()) return toast.error("Color name is required");
    const body = {
      name: name.trim(),
      imageUrl: imageUrl || null,
      isActive: active,
    };
    const run = async () => {
      const res = await fetch(`/api/materials/${materialId}/colors`, { method: "POST", body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    };
    const created = await toast.promise(run(), { loading: "Adding color…", success: "Color added", error: "Failed to add" });
    // Fix: Ensure created is of type MaterialColor by asserting unknown first
    setItems((x) => [...x, created as unknown as MaterialColor]);
    setName(""); setImageUrl(""); // keep active as-is for quick adding
  };

  const toggleActive = async (row: MaterialColor, next: boolean) => {
    setItems((list) => list.map((c) => (c.id === row.id ? { ...c, isActive: next } : c)));
    try {
      await fetch(`/api/materials/${materialId}/colors/${row.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: next }),
      });
    } catch {
      toast.error("Failed to update");
      // revert on error
      setItems((list) => list.map((c) => (c.id === row.id ? { ...c, isActive: !next } : c)));
    }
  };

  const remove = async (row: MaterialColor) => {
    const run = async () => {
      const res = await fetch(`/api/materials/${materialId}/colors/${row.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    };
    await toast.promise(run(), { loading: "Removing…", success: "Removed", error: "Failed to remove" });
    setItems((list) => list.filter((c) => c.id !== row.id));
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle>Colors</CardTitle>
        <CardDescription>Add and manage available colors for this material.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add color form */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input placeholder="e.g., White Oxford" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid gap-2">
            <Label>Image</Label>
            <div className="flex gap-2">
              <Input placeholder="Upload image..." value={imageUrl} readOnly />
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer w-[100px]"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <Button type="button" variant="outline" disabled={uploading}>
                  {uploading ? (
                    <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <>
                      <Upload className="mr-2 size-4" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Active</Label>
            <div className="flex items-center justify-between rounded-md border p-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><PaintBucket className="size-4" /> Usable</div>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
          </div>
          <div className="md:col-span-4">
            <Button onClick={add}><Plus className="mr-2 size-4" />Add Color</Button>
          </div>
        </div>

        <Separator />

        {/* Colors table */}
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-0"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>

                  <TableCell className="text-muted-foreground">
                    {c.imageUrl ? <a href={getAssetUrl(c.imageUrl)} target="_blank" className="underline" rel="noreferrer">Open</a> : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-between rounded-md border p-1 pl-2">
                      <span className="text-xs text-muted-foreground">{c.isActive ? "Active" : "Disabled"}</span>
                      <Switch checked={c.isActive} onCheckedChange={(v) => toggleActive(c, v)} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => remove(c)}>
                      <Trash2 className="mr-2 size-4" /> Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                    No colors yet. Add your first color above.
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
