import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

/**
 * Product prices are stored in the store's base currency in MAJOR units
 * (₹5000 is stored as 5000, not 500000). The storefront's currency selector is
 * display-only — see the `Price` component — so money is always quoted and
 * charged in the base currency.
 */
export const BASE_CURRENCY = "INR" as const;

/** Guards against a client sending an absurd quantity. */
const MAX_QUANTITY_PER_ITEM = 50;

export type CartItemInput = {
  productId: string;
  quantity: number;
};

export type QuotedItem = {
  productId: string;
  productTitle: string;
  quantity: number;
  price: number;
  totalPrice: number;
};

export type Quote = {
  currency: typeof BASE_CURRENCY;
  items: QuotedItem[];
  subtotal: number;
  tax: number;
  taxInclusive: boolean;
  shippingAmount: number;
  shippingMethodId: string | null;
  shippingMethodName: string | null;
  discount: number;
  total: number;
};

export class PricingError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

type ShippingMethod = {
  id?: string;
  name?: string;
  description?: string;
  price?: number;
  active?: boolean;
};

/**
 * Recomputes cart totals from database prices and stored settings. The client's
 * figures are never trusted: it can only choose *what* to buy, not what it costs.
 */
export async function quoteCart(input: {
  items: CartItemInput[];
  shippingMethodId?: string | null;
}): Promise<Quote> {
  const { items, shippingMethodId } = input;

  if (!Array.isArray(items) || items.length === 0) {
    throw new PricingError("Cart is empty");
  }

  // Collapse duplicate lines so a repeated productId cannot skew the lookup.
  const quantityByProduct = new Map<string, number>();
  for (const item of items) {
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new PricingError("Item quantity must be a positive integer");
    }
    if (!item.productId) throw new PricingError("Every cart item needs a productId");
    const next = (quantityByProduct.get(item.productId) ?? 0) + quantity;
    if (next > MAX_QUANTITY_PER_ITEM) {
      throw new PricingError(`Quantity for a single product cannot exceed ${MAX_QUANTITY_PER_ITEM}`);
    }
    quantityByProduct.set(item.productId, next);
  }

  const ids = [...quantityByProduct.keys()];
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
    select: { id: true, title: true, price: true },
  });

  if (products.length !== ids.length) {
    const found = new Set(products.map((p) => p.id));
    const missing = ids.filter((id) => !found.has(id));
    throw new PricingError(`Unavailable product(s): ${missing.join(", ")}`, 409);
  }

  const quotedItems: QuotedItem[] = products.map((p) => {
    const quantity = quantityByProduct.get(p.id)!;
    return {
      productId: p.id,
      productTitle: p.title,
      quantity,
      price: p.price,
      totalPrice: p.price * quantity,
    };
  });

  const subtotal = quotedItems.reduce((sum, i) => sum + i.totalPrice, 0);

  const settings = await getSettings();
  const taxEnabled = settings.taxes?.enabled ?? false;
  const taxInclusive = settings.taxes?.taxInclusive ?? false;
  const taxRate = taxEnabled ? (settings.taxes?.defaultRate ?? 0) / 100 : 0;

  let tax = 0;
  let total = subtotal;
  if (taxEnabled && taxRate > 0) {
    if (taxInclusive) {
      // Tax is already contained in subtotal; report the embedded portion.
      tax = subtotal - subtotal / (1 + taxRate);
      total = subtotal;
    } else {
      tax = subtotal * taxRate;
      total = subtotal + tax;
    }
  }

  const methods = (settings.shipping?.methods ?? []) as ShippingMethod[];
  const activeMethods = methods.filter((m) => m.active);
  const selected =
    activeMethods.find((m) => m.id === shippingMethodId) ?? activeMethods[0] ?? null;

  if (shippingMethodId && !activeMethods.some((m) => m.id === shippingMethodId)) {
    throw new PricingError("Selected shipping method is not available", 409);
  }

  const shippingAmount = Math.round(selected?.price ?? 0);
  total += shippingAmount;

  return {
    currency: BASE_CURRENCY,
    items: quotedItems,
    subtotal: Math.round(subtotal),
    tax: Math.round(tax),
    taxInclusive,
    shippingAmount,
    shippingMethodId: selected?.id ?? null,
    shippingMethodName: selected?.name ?? null,
    discount: 0,
    total: Math.round(total),
  };
}

/** Razorpay expects the smallest currency unit (paise for INR). */
export function toMinorUnits(majorAmount: number) {
  return Math.round(majorAmount * 100);
}
