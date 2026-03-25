"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Upload } from "lucide-react";

type StyleCreate = {
  name: string;
  category: string;
  description?: string | null;
  isActive: boolean;
  imageUrl?: string;
  modelConfig?: {
    glbUrl?: string | null;
    lighting?: string | null;
    environment?: string | null;
  } | null;
};

export default function StyleCreatePage() {
  const router = useRouter();
  const [form, setForm] = React.useState<StyleCreate>({
    name: "",
    category: "oxford",
    description: "",
    imageUrl: "",
    isActive: true,
    modelConfig: { glbUrl: "", lighting: "directional", environment: "studio" },
  });
  const [saving, setSaving] = React.useState(false);
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
      setForm((f) => {
        if (folder === "GLB") {
          return {
            ...f,
            modelConfig: { ...(f.modelConfig ?? {}), glbUrl: data.url },
          };
        } else {
          return {
            ...f,
            imageUrl: data.url,
          };
        }
      });
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    const run = async (): Promise<{ id: string }> => {
      // Flatten modelConfig for the API if necessary, or just send as is
      // Based on prisma schema and validators, it seems the style model expects 
      // direct glbUrl, lighting, environment fields or a modelConfig JSON.
      // Let's check the StyleCreateSchema in lib/validators.ts again if needed.
      // StyleCreateSchema has: glbUrl, lighting, environment, assets

      const { modelConfig, ...rest } = form;
      const payload = {
        ...rest,
        glbUrl: modelConfig?.glbUrl ?? null,
        lighting: modelConfig?.lighting ?? null,
        environment: modelConfig?.environment ?? null,
      };

      const res = await fetch("/api/styles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    };
    const p = run();
    toast.promise(p, { loading: "Creating…", success: "Style created", error: "Failed to create" });
    try {
      await p;
      router.push(`/styles`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/styles"><ArrowLeft className="mr-2 size-4" />Back</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">New Style</h1>
            <p className="text-sm text-muted-foreground">Create a shoe style (e.g., Cap Toe).</p>
          </div>
        </div>
        <Button onClick={onSubmit} disabled={saving}><Save className="mr-2 size-4" />Save</Button>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle>Details</CardTitle>
          <CardDescription>Basic fields for this style.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Category (slug)">
            <Input placeholder="oxford, sneaker, boot…" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Description">
              <Textarea rows={6} value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </Field>
          </div>
          <Field label="Preview Image URL">
            <div className="flex gap-2">
              <Input placeholder="/images/style/style-01.png" value={form.imageUrl ?? ""} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} />
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
            <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle>3D Model</CardTitle>
          <CardDescription>GLB and rendering hints.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <Field label="GLB URL">
            <div className="flex gap-2">
              <Input
                value={form.modelConfig?.glbUrl ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    modelConfig: { ...(f.modelConfig ?? {}), glbUrl: e.target.value },
                  }))
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
            <Input value={form.modelConfig?.lighting ?? ""} onChange={(e) => setForm((f) => ({ ...f, modelConfig: { ...(f.modelConfig ?? {}), lighting: e.target.value } }))} />
          </Field>
          <Field label="Environment">
            <Input value={form.modelConfig?.environment ?? ""} onChange={(e) => setForm((f) => ({ ...f, modelConfig: { ...(f.modelConfig ?? {}), environment: e.target.value } }))} />
          </Field>
        </CardContent>
      </Card>
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
