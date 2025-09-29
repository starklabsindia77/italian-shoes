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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, RefreshCcw, Save } from "lucide-react";

type StyleModelConfig = {
  glbUrl?: string | null;
  lighting?: string | null;
  environment?: string | null;
};

type StyleItem = {
  id: string;
  styleId?: string | null;
  name: string;
  description?: string | null;
  category: string;
  isActive: boolean;
  modelConfig?: StyleModelConfig | null;
  createdAt?: string;
  updatedAt?: string;
};

const FALLBACK_STYLE: StyleItem = {
  id: "st_captoe",
  styleId: "cap-toe",
  name: "Cap Toe",
  category: "oxford",
  isActive: true,
  description: "Classic cap toe oxford",
  modelConfig: { glbUrl: "/glb/styles/captoe.glb", lighting: "directional", environment: "studio" },
};

export default function StyleEditPage() {
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [style, setStyle] = React.useState<StyleItem | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/styles/${id}`, { cache: "no-store" });
      if (!r.ok) throw new Error();
      const data = await r.json();
      setStyle(data ?? FALLBACK_STYLE);
    } catch {
      setStyle(FALLBACK_STYLE);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { if (id) load(); /* eslint-disable-next-line */ }, [id]);

  const saveOverview = async () => {
    if (!style) return;
    setSaving(true);
    const run = async () => {
      const res = await fetch(`/api/styles/${style.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: style.name,
          category: style.category,
          description: style.description,
          isActive: style.isActive,
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

  const saveModel = async () => {
    if (!style) return;
    const run = async () => {
      const res = await fetch(`/api/styles/${style.id}`, {
        method: "PUT",
        body: JSON.stringify({ modelConfig: style.modelConfig ?? {} }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    };
    const p = run();
    toast.promise(p, { loading: "Saving…", success: "Saved", error: "Failed to save" });
    await p;
  };

  if (!style) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/styles"><ArrowLeft className="mr-2 size-4" />Back</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{style.name}</h1>
            <p className="text-sm text-muted-foreground">Category: {style.category}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}><RefreshCcw className="mr-2 size-4" />Refresh</Button>
          <Button onClick={saveOverview} disabled={saving}><Save className="mr-2 size-4" />Save</Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="model">3D Model</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="mt-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle>Details</CardTitle>
              <CardDescription>Update style metadata.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <Field label="Name">
                <Input value={style.name} onChange={(e) => setStyle({ ...style, name: e.target.value })} />
              </Field>
              <Field label="Category (slug)">
                <Input value={style.category} onChange={(e) => setStyle({ ...style, category: e.target.value })} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Description">
                  <Textarea rows={6} value={style.description ?? ""} onChange={(e) => setStyle({ ...style, description: e.target.value })} />
                </Field>
              </div>
              <div className="md:col-span-2 flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium">Active</div>
                  <div className="text-xs text-muted-foreground">Visible & selectable for products</div>
                </div>
                <Switch checked={style.isActive} onCheckedChange={(v) => setStyle({ ...style, isActive: v })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3D MODEL */}
        <TabsContent value="model" className="mt-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle>3D Model</CardTitle>
              <CardDescription>GLB & rendering hints.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-3">
              <Field label="GLB URL">
                <Input
                  value={style.modelConfig?.glbUrl ?? ""}
                  onChange={(e) => setStyle({ ...style, modelConfig: { ...(style.modelConfig ?? {}), glbUrl: e.target.value } })}
                />
              </Field>
              <Field label="Lighting">
                <Input
                  value={style.modelConfig?.lighting ?? ""}
                  onChange={(e) => setStyle({ ...style, modelConfig: { ...(style.modelConfig ?? {}), lighting: e.target.value } })}
                />
              </Field>
              <Field label="Environment">
                <Input
                  value={style.modelConfig?.environment ?? ""}
                  onChange={(e) => setStyle({ ...style, modelConfig: { ...(style.modelConfig ?? {}), environment: e.target.value } })}
                />
              </Field>
              <div className="md:col-span-3">
                <Button onClick={saveModel}><Save className="mr-2 size-4" />Save Model</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRODUCTS (stub) */}
        <TabsContent value="products" className="mt-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle>Linked Products</CardTitle>
              <CardDescription>Products using this style (UI stub — wire to /api/products?styleId=… if needed).</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">Coming soon</Badge>
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
