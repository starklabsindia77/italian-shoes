"use client";

import * as React from "react";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Save } from "lucide-react";

type Currency = "USD" | "EUR" | "GBP";

type Settings = {
  general: {
    storeName: string;
    supportEmail: string;
    supportPhone?: string | null;
    timezone?: string | null; // e.g. "Europe/Rome"
    storefrontUrl?: string | null;
    notes?: string | null;
  };
  currency: {
    defaultCurrency: Currency;
    multiCurrency: boolean;
  };
  taxes: {
    enabled: boolean;
    taxInclusive: boolean;
    defaultRate: number; // %
  };
  integrations: {
    shiprocketEmail?: string | null;
    shiprocketStatus?: "connected" | "disconnected";
  };
  // (optional) roles/permissions would usually be separate; stubbed in UI
};

const FALLBACK: Settings = {
  general: {
    storeName: "Italian Shoes",
    supportEmail: "support@italianshoes.com",
    supportPhone: "+1 (555) 123-4567",
    timezone: "Europe/Rome",
    storefrontUrl: "https://example.com",
    notes: "",
  },
  currency: { defaultCurrency: "USD", multiCurrency: true },
  taxes: { enabled: true, taxInclusive: false, defaultRate: 18 },
  integrations: { shiprocketEmail: "", shiprocketStatus: "disconnected" },
};

export default function SettingsPage() {
  const [data, setData] = React.useState<Settings>(FALLBACK);
  const [loading, setLoading] = React.useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/settings", { cache: "no-store" });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setData({ ...(FALLBACK as any), ...(d ?? {}) });
    } catch {
      setData(FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); }, []);

  const save = async (patch: Partial<Settings>) => {
    const run = async () => {
      const res = await fetch("/api/settings", { method: "PUT", body: JSON.stringify(patch) });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    };
    const p = run();
    toast.promise(p, { loading: "Saving…", success: "Saved", error: "Failed to save" });
    await p;
    await load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="currency">Currency</TabsTrigger>
          <TabsTrigger value="taxes">Taxes</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>

        {/* GENERAL */}
        <TabsContent value="general" className="mt-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle>General</CardTitle>
              <CardDescription>Storefront & contact details.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <Field label="Store Name">
                <Input
                  value={data.general.storeName}
                  onChange={(e) => setData((d) => ({ ...d, general: { ...d.general, storeName: e.target.value } }))}
                />
              </Field>
              <Field label="Support Email">
                <Input
                  type="email"
                  value={data.general.supportEmail}
                  onChange={(e) => setData((d) => ({ ...d, general: { ...d.general, supportEmail: e.target.value } }))}
                />
              </Field>
              <Field label="Support Phone (optional)">
                <Input
                  value={data.general.supportPhone ?? ""}
                  onChange={(e) => setData((d) => ({ ...d, general: { ...d.general, supportPhone: e.target.value } }))}
                />
              </Field>
              <Field label="Storefront URL (optional)">
                <Input
                  value={data.general.storefrontUrl ?? ""}
                  onChange={(e) => setData((d) => ({ ...d, general: { ...d.general, storefrontUrl: e.target.value } }))}
                />
              </Field>
              <Field label="Timezone">
                <Input
                  placeholder="Europe/Rome"
                  value={data.general.timezone ?? ""}
                  onChange={(e) => setData((d) => ({ ...d, general: { ...d.general, timezone: e.target.value } }))}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Notes (internal)">
                  <Textarea
                    rows={4}
                    value={data.general.notes ?? ""}
                    onChange={(e) => setData((d) => ({ ...d, general: { ...d.general, notes: e.target.value } }))}
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Button onClick={() => save({ general: data.general })}><Save className="mr-2 size-4" />Save General</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CURRENCY */}
        <TabsContent value="currency" className="mt-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle>Currency</CardTitle>
              <CardDescription>Default currency and multi-currency mode.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <Field label="Default Currency">
                <Select
                  value={data.currency.defaultCurrency}
                  onValueChange={(v: Currency) =>
                    setData((d) => ({ ...d, currency: { ...d.currency, defaultCurrency: v } }))
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium">Enable multi-currency</div>
                  <div className="text-xs text-muted-foreground">Show prices in USD/EUR/GBP.</div>
                </div>
                <Switch
                  checked={data.currency.multiCurrency}
                  onCheckedChange={(v) => setData((d) => ({ ...d, currency: { ...d.currency, multiCurrency: v } }))}
                />
              </div>
              <div className="md:col-span-2">
                <Button onClick={() => save({ currency: data.currency })}><Save className="mr-2 size-4" />Save Currency</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAXES */}
        <TabsContent value="taxes" className="mt-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle>Taxes</CardTitle>
              <CardDescription>Configure tax calculation.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium">Enable taxes</div>
                  <div className="text-xs text-muted-foreground">Calculate tax on checkout.</div>
                </div>
                <Switch
                  checked={data.taxes.enabled}
                  onCheckedChange={(v) => setData((d) => ({ ...d, taxes: { ...d.taxes, enabled: v } }))}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium">Tax-inclusive pricing</div>
                  <div className="text-xs text-muted-foreground">Show prices including tax.</div>
                </div>
                <Switch
                  checked={data.taxes.taxInclusive}
                  onCheckedChange={(v) => setData((d) => ({ ...d, taxes: { ...d.taxes, taxInclusive: v } }))}
                />
              </div>
              <Field label="Default Tax Rate (%)">
                <Input
                  type="number"
                  value={String(data.taxes.defaultRate)}
                  onChange={(e) =>
                    setData((d) => ({ ...d, taxes: { ...d.taxes, defaultRate: Number(e.target.value || 0) } }))
                  }
                />
              </Field>
              <div className="md:col-span-2">
                <Button onClick={() => save({ taxes: data.taxes })}><Save className="mr-2 size-4" />Save Taxes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INTEGRATIONS */}
        <TabsContent value="integrations" className="mt-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle>ShipRocket</CardTitle>
              <CardDescription>Connect shipping and label generation.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <Field label="Account Email">
                <Input
                  type="email"
                  value={data.integrations.shiprocketEmail ?? ""}
                  onChange={(e) => setData((d) => ({ ...d, integrations: { ...d.integrations, shiprocketEmail: e.target.value } }))}
                />
              </Field>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Connection</div>
                <div className="text-sm font-medium">
                  {data.integrations.shiprocketStatus === "connected" ? "Connected" : "Disconnected"}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => save({ integrations: { ...data.integrations } })}><Save className="mr-2 size-4" />Save Integration</Button>
                  {/* optional action endpoints you might add */}
                  {/* <Button variant="outline" onClick={() => fetch("/api/integrations/shiprocket/connect", { method: "POST" })}>Connect</Button> */}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ROLES (stub) */}
        <TabsContent value="roles" className="mt-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle>Roles & Permissions</CardTitle>
              <CardDescription>Define admin & staff permissions (UI stub).</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This section is a placeholder. You can wire it to <code>/api/settings/roles</code> and manage
                role-based access with your auth solution.
              </p>
              <Separator className="my-4" />
              <div className="grid gap-2">
                <div className="rounded-lg border p-3">
                  <div className="text-sm font-medium">Admin</div>
                  <div className="text-xs text-muted-foreground">Full access</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-sm font-medium">Staff</div>
                  <div className="text-xs text-muted-foreground">Products, Orders</div>
                </div>
              </div>
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
