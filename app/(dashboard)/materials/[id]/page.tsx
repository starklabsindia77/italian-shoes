"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { ColorsCard } from "./colors-card";

type Material = {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type MaterialColor = {
  id: string;
  name: string;
  family?: string | null; // e.g., "White"
  colorCode?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  position?: number | null;
};

const FALLBACK_MATERIAL: Material = {
  id: "mat_leather",
  name: "Leather",
  category: "leather",
  description: "Full-grain leather",
  isActive: true,
};

const FALLBACK_COLORS: MaterialColor[] = [
  {
    id: "c_white",
    name: "White Oxford",
    family: "White",
    imageUrl: "/images/colors/white.png",
    isActive: true,
  },
  {
    id: "c_black",
    name: "Black Oxford",
    family: "Black",
    imageUrl: "/images/colors/black.png",
    isActive: true,
  },
];

export default function MaterialEditPage() {
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [material, setMaterial] = React.useState<Material | null>(null);
  const [colors, setColors] = React.useState<MaterialColor[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/materials/${id}?include=colors`, {
        cache: "no-store",
      });
      if (!r.ok) throw new Error();
      const data = await r.json();
      setMaterial(data ?? FALLBACK_MATERIAL);
      setColors(data?.colors ?? FALLBACK_COLORS);
    } catch {
      setMaterial(FALLBACK_MATERIAL);
      setColors(FALLBACK_COLORS);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (id) load(); /* eslint-disable-next-line */
  }, [id]);

  const saveOverview = async () => {
    if (!material) return;
    setSaving(true);
    const run = async () => {
      const res = await fetch(`/api/materials/${material.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: material.name,
          category: material.category,
          description: material.description,
          isActive: material.isActive,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    };
    const p = run();
    toast.promise(p, {
      loading: "Saving…",
      success: "Saved",
      error: "Failed to save",
    });
    await p;
    setSaving(false);
  };

  // Colors API helpers (graceful if not implemented)
  const createColor = async (
    payload: Omit<MaterialColor, "id" | "position">
  ) => {
    const run = async (): Promise<MaterialColor> => {
      const res = await fetch(`/api/materials/${id}/colors`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    };
    const p = run();
    toast.promise(p, {
      loading: "Adding color…",
      success: "Color added",
      error: "Failed to add",
    });
    try {
      const created = await p;
      setColors((prev) => [...prev, created]);
    } catch {
      // if API missing, mimic creation
      const fake: MaterialColor = { id: `local_${Date.now()}`, ...payload };
      setColors((prev) => [...prev, fake]);
    }
  };

  const updateColor = async (
    c: MaterialColor,
    patch: Partial<MaterialColor>
  ) => {
    // optimistic
    setColors((prev) =>
      prev.map((x) => (x.id === c.id ? { ...x, ...patch } : x))
    );
    const run = async () => {
      const res = await fetch(`/api/materials/${id}/colors/${c.id}`, {
        method: "PUT",
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    };
    try {
      const p = run();
      toast.promise(p, {
        loading: "Updating…",
        success: "Updated",
        error: "Failed to update",
      });
      await p;
    } catch {
      // ignore; page refresh will reconcile
    }
  };

  const deleteColor = async (c: MaterialColor) => {
    const run = async () => {
      const res = await fetch(`/api/materials/${id}/colors/${c.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    };
    const p = run();
    toast.promise(p, {
      loading: "Deleting…",
      success: "Deleted",
      error: "Failed to delete",
    });
    try {
      await p;
    } finally {
      setColors((prev) => prev.filter((x) => x.id !== c.id));
    }
  };

  if (!material) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/materials">
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {material.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Category: {material.category}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}>
            <RefreshCcw className="mr-2 size-4" />
            Refresh
          </Button>
          <Button onClick={saveOverview} disabled={saving}>
            <Save className="mr-2 size-4" />
            Save
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="mt-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle>Details</CardTitle>
              <CardDescription>
                Update material family metadata.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <Field label="Name">
                <Input
                  value={material.name}
                  onChange={(e) =>
                    setMaterial({ ...material, name: e.target.value })
                  }
                />
              </Field>
              <Field label="Category (slug)">
                <Input
                  value={material.category}
                  onChange={(e) =>
                    setMaterial({ ...material, category: e.target.value })
                  }
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Description">
                  <Textarea
                    rows={6}
                    value={material.description ?? ""}
                    onChange={(e) =>
                      setMaterial({ ...material, description: e.target.value })
                    }
                  />
                </Field>
              </div>
              <div className="md:col-span-2 flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium">Active</div>
                  <div className="text-xs text-muted-foreground">
                    Visible & selectable for products
                  </div>
                </div>
                <Switch
                  checked={material.isActive}
                  onCheckedChange={(v) =>
                    setMaterial({ ...material, isActive: v })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* COLORS */}
        <TabsContent value="colors" className="mt-4">
          <ColorsTab
            list={colors}
            onCreate={(payload) => createColor(payload)}
            onToggle={(c, next) => updateColor(c, { isActive: next })}
            onDelete={(c) => deleteColor(c)}
            onPatch={(c, patch) => updateColor(c, patch)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ColorsTab({
  list,
  onCreate,
  onToggle,
  onDelete,
  onPatch,
}: {
  list: MaterialColor[];
  onCreate: (payload: Omit<MaterialColor, "id" | "position">) => Promise<void>;
  onToggle: (c: MaterialColor, next: boolean) => Promise<void>;
  onDelete: (c: MaterialColor) => Promise<void>;
  onPatch: (c: MaterialColor, patch: Partial<MaterialColor>) => Promise<void>;
}) {
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState("");
  const [hex, setHex] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [active, setActive] = React.useState(true);

  const handleCreate = async () => {
    if (!name.trim()) return toast.error("Color name is required");

    await onCreate({
      name: name.trim(),
      family: type || undefined, // optional field
      colorCode: hex || undefined, // optional field
      imageUrl: imageUrl || undefined, // optional field
      isActive: active, // boolean
    });

    // Clear inputs
    setName("");
    setType("");
    setHex("");
    setImageUrl("");
    setActive(true);
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle>Colors</CardTitle>
        <CardDescription>
          Add and manage color values for this material.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Color Form */}
        <div className="grid gap-3 md:grid-cols-5">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Type (group)">
            <Input
              placeholder="e.g., White, Black"
              value={type}
              onChange={(e) => setType(e.target.value)}
            />
          </Field>
          <Field label="Hex code">
            <Input
              placeholder="#000000"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
            />
          </Field>
          <Field label="Image URL">
            <Input
              placeholder="/images/colors/white.png"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </Field>
          <div className="flex items-end">
            <Button onClick={handleCreate}>
              <Plus className="mr-2 size-4" /> Add
            </Button>
          </div>
        </div>

        <Separator />

        {/* Color List Table */}
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Hex</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-0"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <InlineEdit
                      value={c.name}
                      onChange={(v) => onPatch(c, { name: v })}
                    />
                  </TableCell>
                  <TableCell>
                    <InlineEdit
                      value={c.family ?? ""}
                      onChange={(v) => onPatch(c, { family: v || undefined })}
                    />
                  </TableCell>
                  <TableCell>
                    <InlineEdit
                      value={c.colorCode ?? ""}
                      onChange={(v) =>
                        onPatch(c, { colorCode: v || undefined })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {/* {c.imageUrl ?? "—"} */}
                    {c.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.imageUrl ?? ""} alt={c.name} width={32} height={32} />
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    {c.isActive ? (
                      <Badge>Active</Badge>
                    ) : (
                      <Badge variant="secondary">Disabled</Badge>
                    )}
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onToggle(c, !c.isActive)}
                    >
                      {c.isActive ? (
                        <ToggleLeft className="mr-2 size-4" />
                      ) : (
                        <ToggleRight className="mr-2 size-4" />
                      )}
                      {c.isActive ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(c)}
                      className="cursor-pointer text-white"
                    >
                      <Trash2 className="mr-2 size-4" /> Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {list.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-6 text-center text-sm text-muted-foreground"
                  >
                    No colors yet. Add your first above.
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

function InlineEdit({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [val, setVal] = React.useState(value);
  React.useEffect(() => setVal(value), [value]);
  return (
    <Input
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => {
        if (val !== value) onChange(val);
      }}
    />
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}
