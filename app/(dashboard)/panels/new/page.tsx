"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save } from "lucide-react";

type PanelGroup = "FRONT" | "SIDE" | "BACK" | "TOP" | "SOLE" | "LINING";

type PanelCreate = {
  panelId: string;
  name: string;
  group: PanelGroup;
  description?: string | null;
  position: number;
  isActive: boolean;
};

export default function PanelCreatePage() {
  const router = useRouter();
  const [form, setForm] = React.useState<PanelCreate>({
    panelId: "",
    name: "",
    group: "FRONT",
    description: "",
    position: 0,
    isActive: true,
  });
  const [saving, setSaving] = React.useState(false);

  const onSubmit = async () => {
    if (!form.name.trim() || !form.panelId.trim()) {
      toast.error("Name and panelId are required");
      return;
    }
    setSaving(true);
    const run = async (): Promise<{ id: string }> => {
      const res = await fetch("/api/panels", { method: "POST", body: JSON.stringify({ ...form, description: form.description || null }) });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    };
    const p = run();
    toast.promise(p, { loading: "Creating…", success: "Panel created", error: "Failed to create" });
    try {
      const created = await p;
      router.push(`/panels`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/panels"><ArrowLeft className="mr-2 size-4" />Back</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">New Panel</h1>
            <p className="text-sm text-muted-foreground">Define a customizable shoe panel.</p>
          </div>
        </div>
        <Button onClick={onSubmit} disabled={saving}><Save className="mr-2 size-4" />Save</Button>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle>Details</CardTitle>
          <CardDescription>Slug, name, group, order, and status.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <Field label="Panel ID (slug)">
            <Input placeholder="toe-cap" value={form.panelId} onChange={(e) => setForm((f) => ({ ...f, panelId: e.target.value }))} />
          </Field>
          <Field label="Name">
            <Input placeholder="Toe Cap" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Group">
            <Select value={form.group} onValueChange={(v: PanelGroup) => setForm((f) => ({ ...f, group: v }))}>
              <SelectTrigger><SelectValue placeholder="Group" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="FRONT">front</SelectItem>
                <SelectItem value="SIDE">side</SelectItem>
                <SelectItem value="BACK">back</SelectItem>
                <SelectItem value="TOP">top</SelectItem>
                <SelectItem value="SOLE">sole</SelectItem>
                <SelectItem value="LINING">lining</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Position">
            <Input type="number" value={String(form.position)} onChange={(e) => setForm((f) => ({ ...f, position: Number(e.target.value || 0) }))} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Description (optional)">
              <Textarea rows={5} value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </Field>
          </div>
          <div className="md:col-span-2 flex items-center justify-between rounded-lg border p-3">
            <div>
              <div className="text-sm font-medium">Active</div>
              <div className="text-xs text-muted-foreground">Can be used on products</div>
            </div>
            <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
          </div>
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
