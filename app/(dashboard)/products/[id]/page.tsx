"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  ArrowLeft, Check, CircleOff, Factory, Plus, RefreshCw, Save, Sparkles, Trash2,
} from "lucide-react";
import { MaterialSelection, Material, SelectedMaterial } from "@/components/material-selection";
import { StyleSoleSelection, Style, Sole, SelectedItem } from "@/components/style-sole-selection";
import { ProductCreateSchema as ServerProductCreateSchema } from "@/lib/validators";

/* ---------------- types ---------------- */
type Currency = "USD" | "EUR" | "GBP" | "INR";
type OptionType = "SIZE" | "WIDTH" | "STYLE" | "SOLE" | "COLOR" | "MATERIAL" | "CUSTOM";

/** -------- Local UI schema (compatible with server) -------- */
const ProductEditSchema = ServerProductCreateSchema.extend({
  // UI-only fields for easier entry of GLB
  glbUrl: z.string().optional(),
  glbLighting: z.string().optional(),
  glbEnvironment: z.string().optional(),
});

type FormValues = z.infer<typeof ProductEditSchema>;

type Product = {
  id: string;
  productId: string;
  title: string;
  vendor?: string | null;
  description: string;
  price: number;
  currency: Currency;
  compareAtPrice?: number | null;
  isActive: boolean;
  assets?: any;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  selectedMaterials?: any;
  selectedStyles?: any;
  selectedSoles?: any;
  createdAt?: string;
  updatedAt?: string;
};

type ProductOptionValue = {
  id: string;
  value: string;
  label: string;
  position: number;
  isActive: boolean;
};

type ProductOption = {
  id: string;
  code: string;
  name: string;
  type: OptionType;
  position: number;
  isActive: boolean;
  values: ProductOptionValue[];
};

type Variant = {
  id: string;
  sku: string;
  price: number;
  isActive: boolean;
};

type Size = { id: string; sizeId: string; name: string; region: "US" | "EU" | "UK"; value: number };
type ProductSize = { id: string; sizeId: string; width: "STANDARD" | "WIDE" | "EXTRA_WIDE" | "NARROW" };

type Panel = { id: string; panelId: string; name: string; group?: string | null };
type ProductPanel = { id: string; panelId: string; panel?: Panel; isCustomizable: boolean };

/* ---------------- fallback (if API fails) ---------------- */
const FALLBACK_PRODUCT: Product = {
  id: "fake_oxford",
  productId: "oxford-001",
  title: "Premium Oxford Shoes",
  vendor: "Italian Shoes Company",
  description: "<p>Full-grain leather, Goodyear welt…</p>",
  price: 12999,
  currency: "USD",
  compareAtPrice: null,
  isActive: true,
  assets: { glb: { url: "/ShoeSoleFixed.glb", lighting: "directional", environment: "studio" } },
  metaTitle: "Premium Oxford Shoes",
  metaDescription: "Premium Oxford Shoes, Full-grain leather, Goodyear welt…",
  metaKeywords: "Oxford Shoes, Premium Oxford, Full-grain leather",
  selectedMaterials: [],
  selectedStyles: [],
  selectedSoles: [],
};

export default function ProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [product, setProduct] = React.useState<Product | null>(null);

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(ProductEditSchema) as any,
    defaultValues: {
      productId: "",
      title: "",
      vendor: "",
      description: "",
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
      price: 0,
      currency: "INR",
      compareAtPrice: undefined,
      isActive: true,
      glbUrl: "/ShoeSoleFixed.glb",
      glbLighting: "directional",
      glbEnvironment: "studio",
      selectedMaterials: [],
      selectedStyles: [],
      selectedSoles: [],
    },
    mode: "onChange",
  });

  // Wizard state
  const steps = React.useMemo(
    () => [
      { id: "basic", label: "Basic" as const, validate: ["title", "productId", "vendor", "description"] as const },
      {
        id: "seo", label: "SEO" as const, validate: [
          "metaTitle",
          "metaDescription",
          "metaKeywords",
        ] as const
      },
      { id: "pricing", label: "Pricing" as const, validate: ["price", "currency", "compareAtPrice", "isActive"] as const },
      { id: "assets", label: "3D Assets" as const, validate: ["glbUrl", "glbLighting", "glbEnvironment"] as const },
      { id: "materials", label: "Materials" as const, validate: [] as const },
      { id: "styles", label: "Styles" as const, validate: [] as const },
      { id: "soles", label: "Soles" as const, validate: [] as const },
    ],
    []
  );
  const [activeStepIndex, setActiveStepIndex] = React.useState(0);
  const activeStep = steps[activeStepIndex];

  const goToStep = React.useCallback((index: number) => {
    setActiveStepIndex(Math.min(Math.max(index, 0), steps.length - 1));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [steps.length]);

  const handleNext = React.useCallback(async () => {
    const fields = activeStep.validate as readonly (keyof FormValues)[];
    if (fields.length > 0) {
      const ok = await form.trigger(fields as any, { shouldFocus: true });
      if (!ok) return;
    }
    goToStep(activeStepIndex + 1);
  }, [activeStep.validate, activeStepIndex, form, goToStep]);

  const handleBack = React.useCallback(() => {
    goToStep(activeStepIndex - 1);
  }, [activeStepIndex, goToStep]);

  // Material selection state
  const [materials, setMaterials] = React.useState<Material[]>([]);
  const [materialsLoading, setMaterialsLoading] = React.useState(true);
  const [selectedMaterials, setSelectedMaterials] = React.useState<SelectedMaterial[]>([]);

  // Style selection state
  const [styles, setStyles] = React.useState<Style[]>([]);
  const [stylesLoading, setStylesLoading] = React.useState(true);
  const [selectedStyles, setSelectedStyles] = React.useState<SelectedItem[]>([]);

  // Sole selection state
  const [soles, setSoles] = React.useState<Sole[]>([]);
  const [solesLoading, setSolesLoading] = React.useState(true);
  const [selectedSoles, setSelectedSoles] = React.useState<SelectedItem[]>([]);

  // Helper function for building assets
  const buildAssets = React.useCallback((values: Partial<FormValues>) => {
    const glbUrl = values.glbUrl?.trim();
    if (!glbUrl) return {};
    return {
      glb: {
        url: glbUrl,
        lighting: values.glbLighting || "directional",
        environment: values.glbEnvironment || "studio",
      },
    };
  }, []);

  // Helper function to map product data to form format
  const mapProductToForm = React.useCallback((product: Product) => {
    // Map selected materials
    const mappedMaterials: SelectedMaterial[] = [];
    if (product.selectedMaterials && Array.isArray(product.selectedMaterials)) {
      product.selectedMaterials.forEach((material: any) => {
        if (material && typeof material === 'object') {
          mappedMaterials.push({
            materialId: material.materialId || material.id || '',
            materialName: material.materialName || material.name || '',
            selectedColorIds: material.selectedColorIds || [],
            selectedColor: material.selectedColor || [],
            selectAllColors: material.selectAllColors || false
          });
        }
      });
    }

    // Map selected styles
    const mappedStyles: SelectedItem[] = [];
    if (product.selectedStyles && Array.isArray(product.selectedStyles)) {
      product.selectedStyles.forEach((style: any) => {
        if (style && typeof style === 'object') {
          mappedStyles.push({
            id: style.id || '',
            name: style.name || '',
            description: style.description || null,
            category: style.category || null,
            imageUrl: style.imageUrl || null
          });
        }
      });
    }

    // Map selected soles
    const mappedSoles: SelectedItem[] = [];
    if (product.selectedSoles && Array.isArray(product.selectedSoles)) {
      product.selectedSoles.forEach((sole: any) => {
        if (sole && typeof sole === 'object') {
          mappedSoles.push({
            id: sole.id || '',
            name: sole.name || '',
            description: sole.description || null,
            category: sole.category || null,
            imageUrl: sole.imageUrl || null
          });
        }
      });
    }

    return {
      productId: product.productId,
      title: product.title,
      vendor: product.vendor || "",
      description: product.description,
      metaTitle: product.metaTitle,
      metaDescription: product.metaDescription,
      metaKeywords: product.metaKeywords,
      price: product.price,
      currency: product.currency as Currency,
      compareAtPrice: product.compareAtPrice ?? undefined,
      isActive: product.isActive,
      glbUrl: product.assets?.glb?.url || "/ShoeSoleFixed.glb",
      glbLighting: product.assets?.glb?.lighting || "directional",
      glbEnvironment: product.assets?.glb?.environment || "studio",
      selectedMaterials: mappedMaterials,
      selectedStyles: mappedStyles,
      selectedSoles: mappedSoles,
    };
  }, []);

  // Options/variants/sizes/panels

  // Load materials
  React.useEffect(() => {
    const loadMaterials = async () => {
      try {
        const response = await fetch("/api/materials/with-colors");
        if (response.ok) {
          const data = await response.json();
          setMaterials(data.materials || []);
        }
      } catch (error) {
        console.error("Failed to load materials:", error);
      } finally {
        setMaterialsLoading(false);
      }
    };

    loadMaterials();
  }, []);

  // Load styles
  React.useEffect(() => {
    const loadStyles = async () => {
      try {
        const response = await fetch("/api/styles/active");
        if (response.ok) {
          const data = await response.json();
          setStyles(data.styles || []);
        }
      } catch (error) {
        console.error("Failed to load styles:", error);
      } finally {
        setStylesLoading(false);
      }
    };

    loadStyles();
  }, []);

  // Load soles
  React.useEffect(() => {
    const loadSoles = async () => {
      try {
        const response = await fetch("/api/soles/active");
        if (response.ok) {
          const data = await response.json();
          setSoles(data.soles || []);
        }
      } catch (error) {
        console.error("Failed to load soles:", error);
      } finally {
        setSolesLoading(false);
      }
    };

    loadSoles();
  }, []);

  // Update form when selections change
  React.useEffect(() => {
    form.setValue("selectedMaterials", selectedMaterials);
  }, [selectedMaterials, form]);

  React.useEffect(() => {
    form.setValue("selectedStyles", selectedStyles);
  }, [selectedStyles, form]);

  React.useEffect(() => {
    form.setValue("selectedSoles", selectedSoles);
  }, [selectedSoles, form]);

  /* ------------ load everything ------------ */
  const refreshAll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${id}?include=all`, { cache: "no-store" });
      if (!res.ok) throw new Error("product");
      const data = (await res.json()) as Product;
      setProduct(data);

      // Map product data to form format
      const formData = mapProductToForm(data);

      // Update state variables with mapped data
      setSelectedMaterials(formData.selectedMaterials);
      setSelectedStyles(formData.selectedStyles);
      setSelectedSoles(formData.selectedSoles);

      // Populate form with mapped data
      form.reset(formData);
    } catch {
      setProduct(FALLBACK_PRODUCT);
      // Map fallback data to form format
      const formData = mapProductToForm(FALLBACK_PRODUCT);

      // Update state variables with mapped data
      setSelectedMaterials(formData.selectedMaterials);
      setSelectedStyles(formData.selectedStyles);
      setSelectedSoles(formData.selectedSoles);

      // Populate form with mapped data
      form.reset(formData);
    }



    setLoading(false);
  };

  React.useEffect(() => {
    if (id) refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Debug: Log form state changes
  React.useEffect(() => {
    console.log("📝 Form initialized, errors:", form.formState.errors);
  }, [form.formState.errors]);

  const onSubmit = async (values: FormValues) => {
    console.log("🚀 onSubmit function called!");
    if (!product) {
      console.log("❌ No product found, returning early");
      return;
    }
    setSaving(true);

    console.log("Form values:", values);
    console.log("Selected materials:", selectedMaterials);
    console.log("Selected styles:", selectedStyles);
    console.log("Selected soles:", selectedSoles);

    const payload = {
      productId: values.productId,
      title: values.title.trim(),
      vendor: values.vendor?.trim() || "Italian Shoes Company",
      description: values.description,
      metaTitle: values.metaTitle?.trim(),
      metaDescription: values.metaDescription?.trim(),
      metaKeywords: values.metaKeywords?.trim(),
      price: Number(values.price) || 0,
      currency: values.currency,
      compareAtPrice: values.compareAtPrice ? Number(values.compareAtPrice) : undefined,
      isActive: values.isActive ?? true,
      assets: buildAssets(values),
      selectedMaterials: selectedMaterials,
      selectedStyles: selectedStyles,
      selectedSoles: selectedSoles,
    };

    console.log("Payload being sent:", payload);

    const run = async () => {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let msg = "Failed to update product";
        try {
          const j = await res.json();
          if (j?.error) {
            msg = j.error;
            console.error("API Error:", j);
          }
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
        }
        throw new Error(msg);
      }
      return res.json();
    };

    try {
      await toast.promise(run(), {
        loading: "Updating product…",
        success: "Product updated successfully",
        error: (e) => (typeof e === "object" && e && "message" in e ? (e as any).message : String(e)) || "Failed to update",
      });
    } catch (error) {
      console.error("Product update error:", error);
      toast.error("Failed to update product. Please check the console for details.");
    } finally {
      setSaving(false);
    }
  };




  /* ------------ sizes ------------ */




  if (!product) {
    return (
      <div className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/products"><ArrowLeft className="mr-2 size-4" />Back</Link>
          </Button>
          <span className="text-sm text-muted-foreground">Loading product…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/products"><ArrowLeft className="mr-2 size-4" />Back</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{product?.title || "Edit Product"}</h1>
            <p className="text-sm text-muted-foreground">ID: {product?.productId || id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refreshAll}><RefreshCw className="mr-2 size-4" />Refresh</Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeStep.id} onValueChange={(v) => {
            const idx = steps.findIndex((s) => s.id === v);
            if (idx !== -1) setActiveStepIndex(idx);
          }}>
            <TabsList className="w-full flex flex-wrap justify-start">
              {steps.map((s, i) => (
                <TabsTrigger key={s.id} value={s.id} className="data-[state=active]:font-semibold">
                  {i + 1}. {s.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="basic">
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="rounded-2xl">
                    <CardHeader className="pb-3">
                      <CardTitle>Basic Info</CardTitle>
                      <CardDescription>Title, vendor, and description.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      <FormField
                        control={form.control as any}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl><Input placeholder="Premium Oxford Shoes" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control as any}
                          name="productId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Product ID (slug)</FormLabel>
                              <FormControl><Input placeholder="oxford-001" {...field} /></FormControl>
                              <FormDescription>URL/key (unique)</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control as any}
                          name="vendor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vendor</FormLabel>
                              <FormControl><Input placeholder="Italian Shoes Company" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control as any}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (HTML allowed)</FormLabel>
                            <FormControl><Textarea rows={6} placeholder="<p>Full-grain leather, Goodyear welt…</p>" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button type="button" variant="default" onClick={() => handleNext()}>Next</Button>
              </div>
            </TabsContent>

            <TabsContent value="seo">
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="rounded-2xl">
                    <CardHeader className="pb-3">
                      <CardTitle>SEO</CardTitle>
                      <CardDescription>Meta tags for social & search.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control as any}
                          name="metaTitle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meta Title</FormLabel>
                              <FormControl><Input placeholder="Premium Oxford Shoes" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control as any}
                          name="metaKeywords"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meta Keywords</FormLabel>
                              <FormControl><Input placeholder="Oxford Shoes, Full-grain leather…" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control as any}
                        name="metaDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Meta Description</FormLabel>
                            <FormControl><Textarea rows={3} placeholder="Premium Oxford Shoes, Full-grain leather…" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
              <div className="mt-6 flex justify-between gap-2">
                <Button type="button" variant="outline" onClick={() => handleBack()}>Back</Button>
                <Button type="button" onClick={() => handleNext()}>Next</Button>
              </div>
            </TabsContent>

            <TabsContent value="pricing">
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6">
                  <Card className="rounded-2xl">
                    <CardHeader className="pb-3">
                      <CardTitle>Pricing</CardTitle>
                      <CardDescription>Amounts are in <strong>Rupees</strong>.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control as any}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price (rupees)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  step={1}
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    field.onChange(v === "" ? 0 : Number(v));
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control as any}
                          name="compareAtPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Compare at (rupees)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  step={1}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control as any}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="INR">INR</SelectItem>
                                  <SelectItem value="USD">USD</SelectItem>
                                  <SelectItem value="EUR">EUR</SelectItem>
                                  <SelectItem value="GBP">GBP</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Active</div>
                          <div className="text-xs text-muted-foreground">Visible on storefront</div>
                        </div>
                        <FormField
                          control={form.control as any}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              <div className="mt-6 flex justify-between gap-2">
                <Button type="button" variant="outline" onClick={() => handleBack()}>Back</Button>
                <Button type="button" onClick={() => handleNext()}>Next</Button>
              </div>
            </TabsContent>

            <TabsContent value="assets">
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6">
                  <Card className="rounded-2xl">
                    <CardHeader className="pb-3">
                      <CardTitle>3D Assets</CardTitle>
                      <CardDescription>GLB + rendering hints.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      <FormField
                        control={form.control as any}
                        name="glbUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GLB URL</FormLabel>
                            <FormControl><Input placeholder="/ShoeSoleFixed.glb" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control as any}
                          name="glbLighting"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Lighting</FormLabel>
                              <FormControl><Input placeholder="directional" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control as any}
                          name="glbEnvironment"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Environment</FormLabel>
                              <FormControl><Input placeholder="studio" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          const { glbUrl, glbLighting, glbEnvironment } = form.getValues();
                          const assets = buildAssets({ glbUrl, glbLighting, glbEnvironment } as FormValues);
                          toast.info("Assets preview (console)");
                          console.log("assets", assets);
                        }}
                      >
                        <Sparkles className="mr-2 size-4" />
                        Preview assets JSON (console)
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
              <div className="mt-6 flex justify-between gap-2">
                <Button type="button" variant="outline" onClick={() => handleBack()}>Back</Button>
                <Button type="button" onClick={() => handleNext()}>Next</Button>
              </div>
            </TabsContent>

            <TabsContent value="materials">
              <div className="space-y-6">
                <MaterialSelection
                  materials={materials}
                  selectedMaterials={selectedMaterials}
                  onSelectionChange={setSelectedMaterials}
                  loading={materialsLoading}
                />
              </div>
              <div className="mt-6 flex justify-between gap-2">
                <Button type="button" variant="outline" onClick={() => handleBack()}>Back</Button>
                <Button type="button" onClick={handleNext}>Next</Button>
              </div>
            </TabsContent>

            <TabsContent value="styles">
              <div className="space-y-6">
                <StyleSoleSelection
                  items={styles}
                  selectedItems={selectedStyles}
                  onSelectionChange={setSelectedStyles}
                  loading={stylesLoading}
                  title="Style Selection"
                  description="Select available styles for this product."
                  emptyMessage="No styles available. Create styles first in the Styles section."
                />
              </div>
              <div className="mt-6 flex justify-between gap-2">
                <Button type="button" variant="outline" onClick={() => handleBack()}>Back</Button>
                <Button type="button" onClick={() => handleNext()}>Next</Button>
              </div>
            </TabsContent>

            <TabsContent value="soles">
              <div className="space-y-6">
                <StyleSoleSelection
                  items={soles}
                  selectedItems={selectedSoles}
                  onSelectionChange={setSelectedSoles}
                  loading={solesLoading}
                  title="Sole Selection"
                  description="Select available soles for this product."
                  emptyMessage="No soles available. Create soles first in the Soles section."
                />
              </div>
              <div className="flex justify-between gap-2">
                <Button type="button" variant="outline" onClick={() => handleBack()}>Back</Button>
                <Button type="button" onClick={() => handleNext()}>Next</Button>
              </div>
            </TabsContent>


          </Tabs>

          {/* Update Button - Now inside the form */}
          <div className="flex justify-end gap-2 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                console.log("🧪 Test button clicked - form values:", form.getValues());
                console.log("🧪 Form errors:", form.formState.errors);
                console.log("🧪 Form is valid:", form.formState.isValid);
              }}
            >
              Test Form State
            </Button>
            <Button
              type="submit"
              disabled={saving}
              onClick={() => {
                console.log("🔘 Update button clicked");
                console.log("Form errors:", form.formState.errors);
                console.log("Form is valid:", form.formState.isValid);
              }}
            >
              <Save className="mr-2 size-4" />{saving ? "Updating..." : "Update Product"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}






