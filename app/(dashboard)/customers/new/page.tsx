"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save } from "lucide-react";

type CustomerCreate = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  isGuest: boolean;
  // If you support credential signup from admin, add password fields here.
};

export default function CustomerCreatePage() {
  const router = useRouter();
  const [form, setForm] = React.useState<CustomerCreate>({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    isGuest: false,
  });
  const [saving, setSaving] = React.useState(false);

  const onSubmit = async () => {
    if (!form.email.trim()) {
      toast.error("Email is required");
      return;
    }
    setSaving(true);
    const run = async (): Promise<{ id: string }> => {
      const res = await fetch("/api/customers", {
        method: "POST",
        body: JSON.stringify({
          email: form.email,
          firstName: form.firstName || null,
          lastName: form.lastName || null,
          phone: form.phone || null,
          isGuest: form.isGuest,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    };
    const p = run();
    toast.promise(p, { loading: "Creating…", success: "Customer created", error: "Failed to create" });
    try {
      const created = await p;
      router.push(`/customers/${created.id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/customers"><ArrowLeft className="mr-2 size-4" />Back</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">New Customer</h1>
            <p className="text-sm text-muted-foreground">Create a registered or guest customer.</p>
          </div>
        </div>
        <Button onClick={onSubmit} disabled={saving}><Save className="mr-2 size-4" />Save</Button>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle>Details</CardTitle>
          <CardDescription>Basic info for the customer.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </Field>
          <Field label="Phone (optional)">
            <Input
              value={form.phone ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </Field>
          <Field label="First Name (optional)">
            <Input
              value={form.firstName ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            />
          </Field>
          <Field label="Last Name (optional)">
            <Input
              value={form.lastName ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            />
          </Field>
          <div className="md:col-span-2 flex items-center justify-between rounded-lg border p-3">
            <div>
              <div className="text-sm font-medium">Guest account</div>
              <div className="text-xs text-muted-foreground">Guest customers can place orders without login.</div>
            </div>
            <Switch
              checked={form.isGuest}
              onCheckedChange={(v) => setForm((f) => ({ ...f, isGuest: v }))}
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
