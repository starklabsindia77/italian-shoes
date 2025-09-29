"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, RefreshCcw, Save } from "lucide-react";

type Region = "US" | "EU" | "UK";

type SizeItem = {
  id: string;
  name: string;
  region: Region;
  value: number;
  euEquivalent?: string | null;
  ukEquivalent?: string | null;
  sortOrder: number;
  isActive: boolean;
};

const FALLBACK_SIZE: SizeItem = {
  id: "size_us8",
  name: "US 8",
  region: "US",
  value: 8,
  euEquivalent: "EU 41",
  ukEquivalent: "UK 7",
  sortOrder: 80,
  isActive: true,
};

export default function SizeEditPage() {
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [size, setSize] = React.useState<SizeItem | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/sizes/${id}`, { cache: "no-store" });
      if (!r.ok) throw new Error();
      const data = await r.json();
      setSize(data ?? FALLBACK_SIZE);
    } catch {
      setSize(FALLBACK_SIZE);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { if (id) load(); /* eslint-disable-next-line */ }, [id]);

  const save = async () => {
    if (!size) return;
    setSaving(true);
    const run = async () => {
      const res = await fetch(`/api/sizes/${size.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: size.name,
          region: size.region,
          value: size.value,
          euEquivalent: size.euEquivalent ?? null,
          ukEquivalent: size.ukEquivalent ?? null,
          sortOrder: size.sortOrder,
          isActive: size.isActive,
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

  if (!size) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/sizes"><ArrowLeft className="mr-2 size-4" />Back</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{size.name}</h1>
            {/* <p className="text-sm text-muted-foreground">Slug: {size.sizeId}</p> */}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}><RefreshCcw className="mr-2 size-4" />Refresh</Button>
          <Button onClick={save} disabled={saving}><Save className="mr-2 size-4" />Save</Button>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle>Details</CardTitle>
          <CardDescription>Update this size and equivalents.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          {/* <Field label="Size ID (slug)">
            <Input value={size.sizeId} onChange={(e) => setSize({ ...size, sizeId: e.target.value })} />
          </Field> */}
          <Field label="Display Name">
            <Input value={size.name} onChange={(e) => setSize({ ...size, name: e.target.value })} />
          </Field>
          <Field label="Region">
            <Select value={size.region} onValueChange={(v: Region) => setSize({ ...size, region: v })}>
              <SelectTrigger><SelectValue placeholder="Region" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="US">US</SelectItem>
                <SelectItem value="EU">EU</SelectItem>
                <SelectItem value="UK">UK</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Numeric Value">
            <Input
              type="number"
              value={String(size.value)}
              onChange={(e) => setSize({ ...size, value: Number(e.target.value || 0) })}
            />
          </Field>
          <Field label="EU Equivalent (optional)">
            <Input value={size.euEquivalent ?? ""} onChange={(e) => setSize({ ...size, euEquivalent: e.target.value })} />
          </Field>
          <Field label="UK Equivalent (optional)">
            <Input value={size.ukEquivalent ?? ""} onChange={(e) => setSize({ ...size, ukEquivalent: e.target.value })} />
          </Field>
          <Field label="Sort Order">
            <Input
              type="number"
              value={String(size.sortOrder)}
              onChange={(e) => setSize({ ...size, sortOrder: Number(e.target.value || 0) })}
            />
          </Field>
          <div className="md:col-span-2 flex items-center justify-between rounded-lg border p-3">
            <div>
              <div className="text-sm font-medium">Active</div>
              <div className="text-xs text-muted-foreground">Visible & selectable</div>
            </div>
            <Switch checked={size.isActive} onCheckedChange={(v) => setSize({ ...size, isActive: v })} />
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
