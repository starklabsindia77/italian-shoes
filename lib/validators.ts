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
  currency: z.enum(["USD", "EUR", "GBP", "INR"]).default("INR"),
  compareAtPrice: z.number().int().optional(),
  glbUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
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
    imageUrl: z.string().nullable().optional(),
    glbUrl: z.string().nullable().optional(),
    lighting: z.any().nullable().optional(),
    environment: z.any().nullable().optional()
  })).optional(),
  selectedSoles: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    glbUrl: z.string().nullable().optional(),
    lighting: z.any().nullable().optional(),
    environment: z.any().nullable().optional()
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
  region: z.enum(["US", "EU", "UK"]),
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
  group: z.enum(["FRONT", "SIDE", "BACK", "TOP", "SOLE", "LINING"]).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional()
});

// Product Options / Values
export const ProductOptionCreateSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["SIZE", "WIDTH", "STYLE", "SOLE", "COLOR", "MATERIAL", "CUSTOM"]).default("CUSTOM"),
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
  width: z.enum(["STANDARD", "WIDE", "EXTRA_WIDE", "NARROW"]).optional()
});

// Product Sizes
export const ProductSizeLinkSchema = z.object({
  sizeId: z.string(),
  width: z.enum(["STANDARD", "WIDE", "EXTRA_WIDE", "NARROW"]).default("STANDARD")
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
  shippingMethodId: z.string().optional(),
  shippingMethodName: z.string().optional(),
  discount: z.number().int(),
  total: z.number().int(),
  currency: z.enum(["USD", "EUR", "GBP", "INR"]).default("INR"),
  items: z.array(z.object({
    productId: z.string().nullable().optional(),
    productTitle: z.string(),
    sku: z.string().nullable().optional(),
    quantity: z.number().int().min(1),
    price: z.number().int(),
    totalPrice: z.number().int(),
    productVariantId: z.string().nullable().optional(),
    styleId: z.string().nullable().optional(),
    soleId: z.string().nullable().optional(),
    sizeId: z.string().nullable().optional(),
    panelCustomization: z.any(),
    designGlbUrl: z.string().nullable().optional(),
    designThumbnail: z.string().nullable().optional(),
    designConfig: z.any().nullable().optional()
  })).min(1)
});
export const OrderUpdateStatusSchema = z.object({
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
  fulfillmentStatus: z.string().optional(),
  manufacturing: z.object({
    estimatedProductionTime: z.number().optional(),
    actualProductionTime: z.number().nullable().optional(),
    productionStartDate: z.string().nullable().optional(),
    productionEndDate: z.string().nullable().optional(),
    qualityCheckDate: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
  }).optional(),
  shiprocket: z.object({
    awbNumber: z.string().nullable().optional(),
    courierName: z.string().nullable().optional(),
    status: z.string().optional(),
    trackingUrl: z.string().nullable().optional(),
    labelUrl: z.string().nullable().optional(),
    estimatedDelivery: z.string().nullable().optional(),
    actualDelivery: z.string().nullable().optional(),
  }).optional(),
});

// Customers
export const CustomerUpdateSchema = z.object({
  email: z.string().email(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  isGuest: z.boolean().optional(),
});
export const AdminProfileUpdateSchema = z.object({
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal('')),
}).refine((data) => {
  if (data.newPassword && data.newPassword.length > 0 && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: "Current password is required to set a new password",
  path: ["currentPassword"],
});

export const UserCreateSchema = z.object({
  email: z.string().email(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "USER"]).default("USER"),
  customRoleId: z.string().nullable().optional(),
});

export const UserUpdateSchema = z.object({
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  password: z.string().min(6).optional().or(z.literal('')),
  role: z.enum(["ADMIN", "USER"]).optional(),
  customRoleId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});
