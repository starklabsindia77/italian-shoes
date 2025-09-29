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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save } from "lucide-react";

type MaterialCreate = {
  name: string;
  category: string;
  description?: string | null;
  isActive: boolean;
};

export default function MaterialCreatePage() {
  const router = useRouter();
  const [form, setForm] = React.useState<MaterialCreate>({
    name: "",
    category: "leather",
    description: "",
    isActive: true,
  });
  const [saving, setSaving] = React.useState(false);
  const [colors, setColors] = React.useState<any[]>([]);

  const onSubmit = async () => {
    // show popup if either field missing
    if (!form.name.trim() || !form.category.trim()) {
      toast.error("Add the Material Details");
      return;
    }

    setSaving(true);
    console.log("Submitting material:", form);

    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      // helpful debug info in console + user toast
      console.log("POST /api/materials =>", res.status, res.statusText);

      // explicit 404 handling so you see what's wrong
      if (res.status === 404) {
        toast.error(
          "API route not found (404). Check that /api/materials exists."
        );
        return;
      }

      // read body text so we can show helpful message if it's not JSON
      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = text;
      }

      if (!res.ok) {
        const msg =
          typeof data === "string"
            ? data
            : data?.message ?? JSON.stringify(data).slice(0, 300);
        toast.error(`Failed to create: ${res.status} ${msg}`);
        return;
      }

      // success
      toast.success("Material created");

      // always go back to list page
      router.push("/materials");

      // server should return created.id
      // const id = data?.id;
      // if (id) {
      //   router.push(`/materials/${id}`);
      // } else {
      //   // fallback: refresh list or go back
      //   router.push("/materials");
      // }
    } catch (err: any) {
      console.error("Network / fetch error:", err);
      toast.error("Network error: " + (err?.message ?? err));
    } finally {
      setSaving(false);
    }
  };

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
              New Material
            </h1>
            <p className="text-sm text-muted-foreground">
              Create a material family (e.g., Leather, Suede).
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
            Basic fields for this material family.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <Field label="Name" required>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>

          <Field label="Category (slug)">
            <Input
              placeholder="leather, suede, fabric…"
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Description">
              <Textarea
                rows={6}
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
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
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label className="text-sm">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
    </div>
  );
}
