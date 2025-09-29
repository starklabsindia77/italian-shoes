"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // (optional, not used)
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save } from "lucide-react";

type Region = "US" | "EU" | "UK";

type SizeCreate = {
  name: string; // "US 8"
  region: Region;
  value: number;
  euEquivalent?: string | null;
  ukEquivalent?: string | null;
  sortOrder: number;
  isActive: boolean;
};

export default function SizeCreatePage() {
  const router = useRouter();
  const [form, setForm] = React.useState<SizeCreate>({
    name: "",
    region: "US",
    value: 0,
    euEquivalent: "",
    ukEquivalent: "",
    sortOrder: 0,
    isActive: true,
  });
  const [saving, setSaving] = React.useState(false);

  const onSubmit = async () => {
    // Validation
    if (!form.name.trim()) {
      toast.error("Add New Size");
      return;
    }

    setSaving(true);

    const run = async (): Promise<{ id: string }> => {
      const res = await fetch("/api/sizes", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          euEquivalent: form.euEquivalent || null,
          ukEquivalent: form.ukEquivalent || null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    };

    const p = run();
    toast.promise(p, {
      loading: "Creating…",
      success: "Size created",
      error: "Failed to create",
    });

    try {
      const created = await p;
      router.push(`/sizes`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/sizes">
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">New Size</h1>
            <p className="text-sm text-muted-foreground">
              Create a global size (visible on all products).
            </p>
          </div>
        </div>
        <Button onClick={onSubmit} disabled={saving}>
          <Save className="mr-2 size-4" />
          Save
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle>Details</CardTitle>
          <CardDescription>
            Define the size slug, display name, region, and equivalents.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          {/* <Field label="Size ID (slug)">
            <Input
              placeholder="us-8"
              value={form.sizeId}
              onChange={(e) => setForm((f) => ({ ...f, sizeId: e.target.value }))}
            />
          </Field> */}
          <Field label="Display Name">
            <Input
              placeholder="US 8"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>
          <Field label="Region">
            <Select
              value={form.region}
              onValueChange={(v: Region) =>
                setForm((f) => ({ ...f, region: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Region" />
              </SelectTrigger>
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
              value={String(form.value)}
              onChange={(e) =>
                setForm((f) => ({ ...f, value: Number(e.target.value || 0) }))
              }
            />
          </Field>
          <Field label="EU Equivalent (optional)">
            <Input
              placeholder="EU 41"
              value={form.euEquivalent ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, euEquivalent: e.target.value }))
              }
            />
          </Field>
          <Field label="UK Equivalent (optional)">
            <Input
              placeholder="UK 7"
              value={form.ukEquivalent ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, ukEquivalent: e.target.value }))
              }
            />
          </Field>
          <Field label="Sort Order">
            <Input
              type="number"
              value={String(form.sortOrder)}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  sortOrder: Number(e.target.value || 0),
                }))
              }
            />
          </Field>
          <div className="md:col-span-2 flex items-center justify-between rounded-lg border p-3">
            <div>
              <div className="text-sm font-medium">Active</div>
              <div className="text-xs text-muted-foreground">
                Visible & selectable
              </div>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
            />
          </div>
        </CardContent>
      </Card>
    </div>
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
