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
import { Badge } from "@/components/ui/badge";
import { Save, Plus, Trash2, Truck, RefreshCcw, Mail } from "lucide-react";

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
    shiprocketStoreId?: string | null;
    shiprocketFasterCheckoutEnabled: boolean;
    razorpayKeyId?: string | null;
    razorpayKeySecret?: string | null;
    razorpayMagicCheckoutEnabled: boolean;
  };
  shipping: {
    methods: {
      id: string;
      name: string;
      description: string;
      price: number;
      active: boolean;
    }[];
  };
  localization: {
    supportedCountries: {
      code: string;
      name: string;
      currency: string;
      active: boolean;
    }[];
    rates: Record<string, number>;
    lastUpdated?: string | null;
  };
  email: {
    provider: "resend" | "smtp" | "none";
    from: string;
    resendApiKey: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    smtpSecure: boolean;
  };
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
  integrations: {
    shiprocketEmail: "",
    shiprocketStatus: "disconnected",
    shiprocketStoreId: "",
    shiprocketFasterCheckoutEnabled: false,
    razorpayKeyId: "",
    razorpayMagicCheckoutEnabled: false,
  },
  shipping: {
    methods: [
      { id: "std", name: "Standard Shipping", description: "5-7 business days", price: 15, active: true },
      { id: "exp", name: "Express Shipping", description: "2-3 business days", price: 25, active: true },
    ],
  },
  localization: {
    supportedCountries: [
      { code: "in", name: "India", currency: "INR", active: true },
      { code: "us", name: "United States", currency: "USD", active: false },
      { code: "uk", name: "United Kingdom", currency: "GBP", active: false },
      { code: "eu", name: "European Union", currency: "EUR", active: false },
    ],
    rates: { "USD": 0.012, "EUR": 0.011, "GBP": 0.0094, "INR": 1 },
    lastUpdated: new Date().toISOString(),
  },
  email: {
    provider: "resend",
    from: "Italian Shoes <orders@updates.starklabs.in>",
    resendApiKey: "",
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPass: "",
    smtpSecure: true,
  }
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
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="regional">Regional & Currencies</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
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
        {/* SHIPPING */}
        <TabsContent value="shipping" className="mt-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Shipping Methods</CardTitle>
                  <CardDescription>Configure your store&apos;s shipping options.</CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    const newId = Math.random().toString(36).substring(2, 9);
                    setData((d) => ({
                      ...d,
                      shipping: {
                        ...d.shipping,
                        methods: [
                          ...d.shipping.methods,
                          { id: newId, name: "New Method", description: "Details...", price: 0, active: true },
                        ],
                      },
                    }));
                  }}
                >
                  <Plus className="mr-2 size-4" />Add Method
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.shipping.methods.map((method, idx) => (
                <div key={method.id} className="relative rounded-xl border p-4 space-y-4">
                  <div className="absolute right-4 top-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setData((d) => ({
                          ...d,
                          shipping: {
                            ...d.shipping,
                            methods: d.shipping.methods.filter((_, i) => i !== idx),
                          },
                        }));
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3 pr-10">
                    <Field label="Name">
                      <Input
                        value={method.name}
                        onChange={(e) => {
                          const next = [...data.shipping.methods];
                          next[idx] = { ...next[idx], name: e.target.value };
                          setData((d) => ({ ...d, shipping: { ...d.shipping, methods: next } }));
                        }}
                      />
                    </Field>
                    <Field label="Price (fixed)">
                      <Input
                        type="number"
                        value={String(method.price)}
                        onChange={(e) => {
                          const next = [...data.shipping.methods];
                          next[idx] = { ...next[idx], price: Number(e.target.value || 0) };
                          setData((d) => ({ ...d, shipping: { ...d.shipping, methods: next } }));
                        }}
                      />
                    </Field>
                    <div className="flex flex-col justify-end pb-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Active</Label>
                        <Switch
                          checked={method.active}
                          onCheckedChange={(v) => {
                            const next = [...data.shipping.methods];
                            next[idx] = { ...next[idx], active: v };
                            setData((d) => ({ ...d, shipping: { ...d.shipping, methods: next } }));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <Field label="Description / Timeframe">
                    <Input
                      value={method.description}
                      onChange={(e) => {
                        const next = [...data.shipping.methods];
                        next[idx] = { ...next[idx], description: e.target.value };
                        setData((d) => ({ ...d, shipping: { ...d.shipping, methods: next } }));
                      }}
                    />
                  </Field>
                </div>
              ))}

              {data.shipping.methods.length === 0 && (
                <div className="text-center py-10 border rounded-xl border-dashed">
                  <Truck className="mx-auto size-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No shipping methods configured.</p>
                </div>
              )}

              <div className="pt-2">
                <Button onClick={() => save({ shipping: data.shipping })}><Save className="mr-2 size-4" />Save Shipping Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INTEGRATIONS */}
        <TabsContent value="integrations" className="mt-4 space-y-6">
          {/* <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle>ShipRocket Integration</CardTitle>
              <CardDescription>Manage your shipping and Faster Checkout with ShipRocket.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <Field label="ShipRocket Email">
                <Input
                  placeholder="email@example.com"
                  value={data.integrations.shiprocketEmail ?? ""}
                  onChange={(e) => setData((d) => ({ ...d, integrations: { ...d.integrations, shiprocketEmail: e.target.value } }))}
                />
              </Field>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium">Connection Status</div>
                  <div className="text-xs text-muted-foreground">{data.integrations.shiprocketStatus === "connected" ? "Successfully connected" : "Not connected"}</div>
                </div>
                <Badge variant={data.integrations.shiprocketStatus === "connected" ? "default" : "secondary"}>
                  {data.integrations.shiprocketStatus === "connected" ? "Connected" : "Disconnected"}
                </Badge>
              </div>

              <div className="md:col-span-2 border-t pt-4 mt-2">
                <h4 className="text-sm font-semibold mb-4">Faster Checkout (FastRR)</h4>
              </div>

              <Field label="Shiprocket Store ID">
                <Input
                  placeholder="e.g. 123456"
                  value={data.integrations.shiprocketStoreId ?? ""}
                  onChange={(e) => setData((d) => ({ ...d, integrations: { ...d.integrations, shiprocketStoreId: e.target.value } }))}
                />
              </Field>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium">Enable Faster Checkout</div>
                  <div className="text-xs text-muted-foreground">Enable FastRR one-click checkout.</div>
                </div>
                <Switch
                  checked={data.integrations.shiprocketFasterCheckoutEnabled}
                  onCheckedChange={(v) => setData((d) => ({
                    ...d,
                    integrations: {
                      ...d.integrations,
                      shiprocketFasterCheckoutEnabled: v,
                      razorpayMagicCheckoutEnabled: v ? false : d.integrations.razorpayMagicCheckoutEnabled
                    }
                  }))}
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => save({ integrations: { ...data.integrations } })}><Save className="mr-2 size-4" />Save ShipRocket Settings</Button>
                </div>
              </div>
            </CardContent>
          </Card> */}

          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle>Razorpay Payment Gateway</CardTitle>
              <CardDescription>Enable Razorpay Payment Gateway.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <Field label="Razorpay Key ID">
                <Input
                  placeholder="rzp_test_..."
                  value={data.integrations.razorpayKeyId ?? ""}
                  onChange={(e) => setData((d) => ({ ...d, integrations: { ...d.integrations, razorpayKeyId: e.target.value } }))}
                />
              </Field>
              <Field label="Razorpay Key Secret">
                <Input
                  type="password"
                  placeholder="Secret key"
                  value={data.integrations.razorpayKeySecret ?? ""}
                  onChange={(e) => setData((d) => ({ ...d, integrations: { ...d.integrations, razorpayKeySecret: e.target.value } }))}
                />
              </Field>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium">Enable Razorpay Payment Gateway</div>
                </div>
                <Switch
                  checked={data.integrations.razorpayMagicCheckoutEnabled}
                  onCheckedChange={(v) => setData((d) => ({
                    ...d,
                    integrations: {
                      ...d.integrations,
                      razorpayMagicCheckoutEnabled: v,
                      shiprocketFasterCheckoutEnabled: v ? false : d.integrations.shiprocketFasterCheckoutEnabled
                    }
                  }))}
                />
              </div>
              <div className="md:col-span-2">
                <Button onClick={() => save({ integrations: { ...data.integrations } })}><Save className="mr-2 size-4" />Save Razorpay Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EMAIL */}
        <TabsContent value="email" className="mt-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>Configure how your store sends emails to customers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Field label="Email Provider">
                  <Select
                    value={data.email.provider}
                    onValueChange={(v: any) => setData(d => ({ ...d, email: { ...d.email, provider: v } }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Disabled (No Emails)</SelectItem>
                      <SelectItem value="resend">Resend (Recommended)</SelectItem>
                      <SelectItem value="smtp">Custom SMTP</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Send From (Email Address)">
                  <Input
                    placeholder="Italian Shoes <orders@yourdomain.com>"
                    value={data.email.from}
                    onChange={(e) => setData(d => ({ ...d, email: { ...d.email, from: e.target.value } }))}
                  />
                </Field>
              </div>

              <Separator />

              {data.email.provider === "resend" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Badge variant="outline">Resend</Badge> Settings
                  </h3>
                  <Field label="Resend API Key">
                    <Input
                      type="password"
                      placeholder="re_..."
                      value={data.email.resendApiKey}
                      onChange={(e) => setData(d => ({ ...d, email: { ...d.email, resendApiKey: e.target.value } }))}
                    />
                  </Field>
                  <p className="text-xs text-muted-foreground">
                    Get your API key from <a href="https://resend.com" target="_blank" className="underline text-primary">resend.com</a>.
                  </p>
                </div>
              )}

              {data.email.provider === "smtp" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Badge variant="outline">SMTP</Badge> Settings
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="SMTP Host">
                      <Input
                        placeholder="smtp.example.com"
                        value={data.email.smtpHost}
                        onChange={(e) => setData(d => ({ ...d, email: { ...d.email, smtpHost: e.target.value } }))}
                      />
                    </Field>
                    <Field label="SMTP Port">
                      <Input
                        type="number"
                        placeholder="587"
                        value={String(data.email.smtpPort)}
                        onChange={(e) => setData(d => ({ ...d, email: { ...d.email, smtpPort: Number(e.target.value || 0) } }))}
                      />
                    </Field>
                    <Field label="SMTP User">
                      <Input
                        placeholder="user@example.com"
                        value={data.email.smtpUser}
                        onChange={(e) => setData(d => ({ ...d, email: { ...d.email, smtpUser: e.target.value } }))}
                      />
                    </Field>
                    <Field label="SMTP Password">
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={data.email.smtpPass}
                        onChange={(e) => setData(d => ({ ...d, email: { ...d.email, smtpPass: e.target.value } }))}
                      />
                    </Field>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={data.email.smtpSecure}
                      onCheckedChange={(v) => setData(d => ({ ...d, email: { ...d.email, smtpSecure: v } }))}
                    />
                    <Label className="text-sm font-normal">Use Secure Connection (TLS/SSL)</Label>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Button onClick={() => save({ email: data.email })}><Save className="mr-2 size-4" />Save Email Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REGIONAL & CURRENCIES */}
        <TabsContent value="regional" className="mt-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Regional Settings</CardTitle>
                  <CardDescription>Manage supported countries and exchange rates.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={async () => {
                  const run = async () => {
                    const res = await fetch("/api/settings", { method: "PUT", body: JSON.stringify({ syncRates: true }) });
                    if (!res.ok) throw new Error(await res.text());
                    return res.json();
                  };
                  toast.promise(run(), {
                    loading: "Syncing rates...",
                    success: () => {
                      load();
                      return "Exchange rates updated";
                    },
                    error: "Failed to sync rates"
                  });
                }}>
                  <RefreshCcw className="mr-2 size-4" />Sync Rates
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Country</th>
                      <th className="px-4 py-2 text-left font-medium">Currency</th>
                      <th className="px-4 py-2 text-center font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.localization.supportedCountries.map((c, idx) => (
                      <tr key={c.code}>
                        <td className="px-4 py-3">{c.name}</td>
                        <td className="px-4 py-3 font-mono">{c.currency}</td>
                        <td className="px-4 py-3 text-center">
                          <Switch
                            checked={c.active}
                            onCheckedChange={(v) => {
                              const newList = [...data.localization.supportedCountries];
                              newList[idx] = { ...c, active: v };
                              setData(d => ({ ...d, localization: { ...d.localization, supportedCountries: newList } }));
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-muted/30 border-none shadow-none">
                  <CardContent className="p-4 space-y-2">
                    <div className="text-xs uppercase font-bold text-muted-foreground">Exchange Rates (Relative to INR)</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(data.localization.rates).map(([curr, rate]) => (
                        <div key={curr} className="flex justify-between border-b border-muted py-1">
                          <span className="font-medium">{curr}</span>
                          <span className="font-mono text-muted-foreground">{rate}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] text-muted-foreground pt-2 italic">
                      Last updated: {data.localization.lastUpdated ? new Date(data.localization.lastUpdated).toLocaleString() : "Never"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-2">
                <Button onClick={() => save({ localization: data.localization })}><Save className="mr-2 size-4" />Save Regional Settings</Button>
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
