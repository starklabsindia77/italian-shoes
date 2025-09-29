"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, RefreshCcw, Save } from "lucide-react";

type PanelGroup = "front" | "side" | "back" | "top" | "sole" | "lining";

type PanelItem = {
  id: string;
  panelId: string;        // slug
  name: string;
  group: PanelGroup;
  description?: string | null;
  position: number;
  isActive: boolean;
};

const FALLBACK_PANEL: PanelItem = {
  id: "p_toe",
  panelId: "toe-cap",
  name: "Toe Cap",
  group: "front",
  position: 10,
  isActive: true,
  description: "Front toe cap panel",
};

export default function PanelEditPage() {
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [panel, setPanel] = React.useState<PanelItem | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/panels/${id}`, { cache: "no-store" });
      if (!r.ok) throw new Error();
      const data = (await r.json()) as PanelItem;
      setPanel(data ?? FALLBACK_PANEL);
    } catch {
      setPanel(FALLBACK_PANEL);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const save = async () => {
    if (!panel) return;
    setSaving(true);
    const run = async () => {
      const res = await fetch(`/api/panels/${panel.id}`, {
        method: "PUT",
        body: JSON.stringify({
          panelId: panel.panelId,
          name: panel.name,
          group: panel.group,
          description: panel.description ?? null,
          position: panel.position,
          isActive: panel.isActive,
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

  if (!panel) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/panels">
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{panel.name}</h1>
            <p className="text-sm text-muted-foreground">Slug: {panel.panelId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}>
            <RefreshCcw className="mr-2 size-4" />
            Refresh
          </Button>
          <Button onClick={save} disabled={saving}>
            <Save className="mr-2 size-4" />
            Save
          </Button>
        </div>
      </div>

      {/* Form */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle>Details</CardTitle>
          <CardDescription>Update name, group, order, and status.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <Field label="Panel ID (slug)">
            <Input
              value={panel.panelId}
              onChange={(e) => setPanel({ ...panel, panelId: e.target.value })}
            />
          </Field>
          <Field label="Name">
            <Input
              value={panel.name}
              onChange={(e) => setPanel({ ...panel, name: e.target.value })}
            />
          </Field>
          <Field label="Group">
            <Select
              value={panel.group}
              onValueChange={(v: PanelGroup) => setPanel({ ...panel, group: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="front">front</SelectItem>
                <SelectItem value="side">side</SelectItem>
                <SelectItem value="back">back</SelectItem>
                <SelectItem value="top">top</SelectItem>
                <SelectItem value="sole">sole</SelectItem>
                <SelectItem value="lining">lining</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Position">
            <Input
              type="number"
              value={String(panel.position)}
              onChange={(e) =>
                setPanel({ ...panel, position: Number(e.target.value || 0) })
              }
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Description (optional)">
              <Textarea
                rows={5}
                value={panel.description ?? ""}
                onChange={(e) => setPanel({ ...panel, description: e.target.value })}
              />
            </Field>
          </div>
          <div className="md:col-span-2 flex items-center justify-between rounded-lg border p-3">
            <div>
              <div className="text-sm font-medium">Active</div>
              <div className="text-xs text-muted-foreground">Can be used on products</div>
            </div>
            <Switch
              checked={panel.isActive}
              onCheckedChange={(v) => setPanel({ ...panel, isActive: v })}
            />
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
