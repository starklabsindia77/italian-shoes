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
import { ArrowLeft, Save } from "lucide-react";

type SoleCreate = {
  name: string;
  category: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  modelConfig?: {
    glbUrl?: string | null;
    lighting?: string | null;
    environment?: string | null;
  } | null;
};

export default function SoleCreatePage() {
  const router = useRouter();
  const [form, setForm] = React.useState<SoleCreate>({
    name: "",
    category: "rubber",
    description: "",
    imageUrl: "",
    isActive: true,
    modelConfig: { glbUrl: "", lighting: "directional", environment: "studio" },
  });
  const [saving, setSaving] = React.useState(false);

  const onSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    const run = async (): Promise<{ id: string }> => {
      const res = await fetch("/api/soles", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    };
    const p = run();
    toast.promise(p, { loading: "Creating…", success: "Sole created", error: "Failed to create" });
    try {
      const created = await p;
      router.push(`/soles`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/soles"><ArrowLeft className="mr-2 size-4" />Back</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">New Sole</h1>
            <p className="text-sm text-muted-foreground">Create a sole (e.g., rubber, leather).</p>
          </div>
        </div>
        <Button onClick={onSubmit} disabled={saving}><Save className="mr-2 size-4" />Save</Button>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle>Details</CardTitle>
          <CardDescription>Basic fields for this sole.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Category (slug)">
            <Input placeholder="rubber, leather, cork…" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Description">
              <Textarea rows={6} value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </Field>
          </div>
          <Field label="Preview Image URL">
            <Input placeholder="/images/soles/sole-01.png" value={form.imageUrl ?? ""} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} />
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
            <Input value={form.modelConfig?.glbUrl ?? ""} onChange={(e) => setForm((f) => ({ ...f, modelConfig: { ...(f.modelConfig ?? {}), glbUrl: e.target.value } }))} />
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
