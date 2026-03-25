"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, RefreshCcw, Save, Upload } from "lucide-react";

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
};

const FALLBACK_SOLE: SoleItem = {
  id: "sole_01",
  soleId: "sole-01",
  name: "Sole 01",
  category: "rubber",
  description: "Durable rubber sole",
  imageUrl: "/images/soles/sole-01.png",
  isActive: true,
  modelConfig: { glbUrl: "/glb/soles/sole-01.glb", lighting: "directional", environment: "studio" },
};

export default function SoleEditPage() {
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [sole, setSole] = React.useState<SoleItem | null>(null);
  const [uploading, setUploading] = React.useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, folder: "GLB" | "thumbnail" = "GLB") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/assets/upload?folder=${folder}`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      if (sole) {
        if (folder === "GLB") {
          setSole({
            ...sole,
            modelConfig: { ...(sole.modelConfig ?? {}), glbUrl: data.url },
          });
        } else {
          setSole({
            ...sole,
            imageUrl: data.url,
          });
        }
      }
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/soles/${id}`, { cache: "no-store" });
      if (!r.ok) throw new Error();
      const data = await r.json();
      data.modelConfig = {
        glbUrl: data.glbUrl,
        lighting: data.lighting,
        environment: data.environment,
      }
      setSole(data ?? FALLBACK_SOLE);
    } catch {
      setSole(FALLBACK_SOLE);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const saveOverview = async () => {
    if (!sole) return;
    setSaving(true);
    const run = async () => {
      const res = await fetch(`/api/soles/${sole.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: sole.name,
          category: sole.category,
          description: sole.description,
          imageUrl: sole.imageUrl ?? null,
          isActive: sole.isActive,
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
    if (!sole) return;
    const run = async () => {
      const res = await fetch(`/api/soles/${sole.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          glbUrl: sole.modelConfig?.glbUrl ?? null,
          lighting: sole.modelConfig?.lighting ?? null,
          environment: sole.modelConfig?.environment ?? null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    };
    const p = run();
    toast.promise(p, { loading: "Saving…", success: "Saved", error: "Failed to save" });
    await p;
  };

  if (!sole) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/soles">
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{sole.name}</h1>
            <p className="text-sm text-muted-foreground">Category: {sole.category}</p>
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
          <TabsTrigger value="model">3D Model</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="mt-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle>Details</CardTitle>
              <CardDescription>Update sole metadata.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <Field label="Name">
                <Input value={sole.name} onChange={(e) => setSole({ ...sole, name: e.target.value })} />
              </Field>
              <Field label="Category (slug)">
                <Input value={sole.category} onChange={(e) => setSole({ ...sole, category: e.target.value })} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Description">
                  <Textarea
                    rows={6}
                    value={sole.description ?? ""}
                    onChange={(e) => setSole({ ...sole, description: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Preview Image URL">
                <div className="flex gap-2">
                  <Input value={sole.imageUrl ?? ""} onChange={(e) => setSole({ ...sole, imageUrl: e.target.value })} />
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer w-[100px]"
                      onChange={(e) => handleFileUpload(e, "thumbnail")}
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
              </Field>
              <div className="md:col-span-2 flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium">Active</div>
                  <div className="text-xs text-muted-foreground">Visible & selectable for products</div>
                </div>
                <Switch checked={sole.isActive} onCheckedChange={(v) => setSole({ ...sole, isActive: v })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3D MODEL */}
        <TabsContent value="model" className="mt-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle>3D Model</CardTitle>
              <CardDescription>GLB &amp; rendering hints.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-3">
              <Field label="GLB URL">
                <div className="flex gap-2">
                  <Input
                    value={sole.modelConfig?.glbUrl ?? ""}
                    onChange={(e) =>
                      setSole({
                        ...sole,
                        modelConfig: { ...(sole.modelConfig ?? {}), glbUrl: e.target.value },
                      })
                    }
                  />
                  <div className="relative">
                    <input
                      type="file"
                      accept=".glb"
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
              </Field>
              <Field label="Lighting">
                <Input
                  value={sole.modelConfig?.lighting ?? ""}
                  onChange={(e) =>
                    setSole({
                      ...sole,
                      modelConfig: { ...(sole.modelConfig ?? {}), lighting: e.target.value },
                    })
                  }
                />
              </Field>
              <Field label="Environment">
                <Input
                  value={sole.modelConfig?.environment ?? ""}
                  onChange={(e) =>
                    setSole({
                      ...sole,
                      modelConfig: { ...(sole.modelConfig ?? {}), environment: e.target.value },
                    })
                  }
                />
              </Field>
              <div className="md:col-span-3">
                <Button onClick={saveModel}>
                  <Save className="mr-2 size-4" />
                  Save Model
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRODUCTS (stub) */}
        <TabsContent value="products" className="mt-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle>Linked Products</CardTitle>
              <CardDescription>
                Products using this sole (UI stub — wire to <code>/api/products?soleId=…</code> if needed).
              </CardDescription>
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
