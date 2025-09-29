import { z } from "zod";

// Product
export const ProductCreateSchema = z.object({
  productId: z.string().min(1),
  title: z.string().min(1),
  vendor: z.string().optional(),
  description: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  price: z.number().int().nonnegative(),
  currency: z.enum(["USD","EUR","GBP","INR"]).default("INR"),
  compareAtPrice: z.number().int().optional(),
  assets: z.any().optional(),
  isActive: z.boolean().optional(),
  selectedMaterials: z.array(z.object({
    materialId: z.string(),
    materialName: z.string(),
    selectedColorIds: z.array(z.string()),
    selectedColor: z.array(z.any()),
    selectAllColors: z.boolean()
  })).optional(),
  selectedStyles: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional()
  })).optional(),
  selectedSoles: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional()
  })).optional()
});
export const ProductUpdateSchema = ProductCreateSchema.partial();

// Material & Color
export const MaterialCreateSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  category: z.string(),
  isActive: z.boolean().optional(),
});
export const MaterialColorCreateSchema = z.object({
  materialId: z.string().min(1),
  name: z.string(),
  family: z.string().optional(),
  colorCode: z.string().optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Style / Sole
export const StyleCreateSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  imageUrl: z.string().optional(),
  glbUrl: z.string().optional(),
  lighting: z.any().optional(),
  environment: z.any().optional(),
  assets: z.any().optional(),
  isActive: z.boolean().optional()
});
export const SoleCreateSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  imageUrl: z.string().optional(),
  glbUrl: z.string().optional(),
  lighting: z.any().optional(),
  environment: z.any().optional(),
  assets: z.any().optional(),
  isActive: z.boolean().optional()
});

// Size
export const SizeCreateSchema = z.object({
  name: z.string(),
  region: z.enum(["US","EU","UK"]),
  value: z.number(),
  euEquivalent: z.string().optional(),
  ukEquivalent: z.string().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional()
});

// Panel
export const PanelCreateSchema = z.object({
  panelId: z.string().optional(),
  name: z.string(),
  group: z.enum(["FRONT","SIDE","BACK","TOP","SOLE","LINING"]).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional()
});

// Product Options / Values
export const ProductOptionCreateSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["SIZE","WIDTH","STYLE","SOLE","COLOR","MATERIAL","CUSTOM"]).default("CUSTOM"),
  position: z.number().int().optional(),
  isActive: z.boolean().optional(),
  metadata: z.any().optional(),
});
export const ProductOptionValueCreateSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  position: z.number().int().optional(),
  isActive: z.boolean().optional(),
  metadata: z.any().optional(),
  sizeId: z.string().optional(),
  styleId: z.string().optional(),
  soleId: z.string().optional(),
  materialColorId: z.string().optional(),
  width: z.enum(["STANDARD","WIDE","EXTRA_WIDE","NARROW"]).optional()
});

// Product Sizes
export const ProductSizeLinkSchema = z.object({
  sizeId: z.string(),
  width: z.enum(["STANDARD","WIDE","EXTRA_WIDE","NARROW"]).default("STANDARD")
});

// Panels & allowed colors
export const ProductPanelUpsertSchema = z.object({
  panelId: z.string(),                 // Panel.panelId
  isCustomizable: z.boolean().optional(),
  modelUrl: z.string().optional(),
  defaultMaterialColorId: z.string().optional(),
});
export const ProductPanelColorsSetSchema = z.object({
  panelId: z.string(),                 // Panel.panelId
  materialColorIds: z.array(z.string()).min(1)
});

// Generate variants
export const GenerateVariantsSchema = z.object({
  optionCodes: z.array(z.string()).min(1),   // e.g., ["size","style","sole"]
  skuPrefix: z.string().default("SKU"),
  priceOverride: z.number().int().optional()
});

// Orders
export const OrderCreateSchema = z.object({
  orderId: z.string(),
  orderNumber: z.string(),
  customerEmail: z.string().email(),
  customerFirstName: z.string().optional(),
  customerLastName: z.string().optional(),
  customerPhone: z.string().optional(),
  isGuest: z.boolean().default(false),
  shippingAddress: z.any(),
  billingAddress: z.any(),
  subtotal: z.number().int(),
  tax: z.number().int(),
  shippingAmount: z.number().int(),
  discount: z.number().int(),
  total: z.number().int(),
  currency: z.enum(["USD","EUR","GBP","INR"]).default("INR"),
  items: z.array(z.object({
    productId: z.string().optional(),
    productTitle: z.string(),
    sku: z.string().optional(),
    quantity: z.number().int().min(1),
    price: z.number().int(),
    totalPrice: z.number().int(),
    productVariantId: z.string().optional(),
    styleId: z.string().optional(),
    soleId: z.string().optional(),
    sizeId: z.string().optional(),
    panelCustomization: z.any(),
    designGlbUrl: z.string().optional(),
    designThumbnail: z.string().optional(),
    designConfig: z.any().optional()
  })).min(1)
});
export const OrderUpdateStatusSchema = z.object({
  status: z.enum(["DESIGN_RECEIVED","IN_PRODUCTION","QUALITY_CHECK","READY_TO_SHIP","SHIPPED","DELIVERED","CANCELLED"]).optional(),
  paymentStatus: z.enum(["PENDING","PAID","FAILED","REFUNDED","PARTIALLY_REFUNDED"]).optional(),
  fulfillmentStatus: z.enum(["UNFULFILLED","IN_PRODUCTION","READY_TO_SHIP","SHIPPED","DELIVERED"]).optional(),
});
