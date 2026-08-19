import Razorpay from "razorpay";
import { z } from "zod";
import { ok, bad, server } from "@/lib/api-helpers";
import { getRazorpayCredentials } from "@/lib/razorpay";
import { quoteCart, toMinorUnits, PricingError, BASE_CURRENCY } from "@/lib/pricing";

/**
 * The client sends what it wants to buy — never what it costs. The amount is
 * derived from database prices and stored tax/shipping settings, so a tampered
 * request cannot create a ₹1 order for a ₹50,000 cart.
 */
const CreateOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1),
      })
    )
    .min(1),
  shippingMethodId: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const raw = await req.json().catch(() => null);
    const parsed = CreateOrderSchema.safeParse(raw);
    if (!parsed.success) return bad(parsed.error.message);

    const credentials = await getRazorpayCredentials();
    if (!credentials) {
      return bad(
        "Razorpay keys are not configured. Set them in admin settings or the environment.",
        503
      );
    }

    const quote = await quoteCart({
      items: parsed.data.items,
      shippingMethodId: parsed.data.shippingMethodId ?? null,
    });

    if (quote.total <= 0) return bad("Order total must be greater than zero");

    const razorpay = new Razorpay({
      key_id: credentials.keyId,
      key_secret: credentials.keySecret,
    });

    const order = await razorpay.orders.create({
      amount: toMinorUnits(quote.total),
      // Always the base currency: prices are stored in it and the storefront's
      // currency selector only affects display.
      currency: BASE_CURRENCY,
      receipt: `rcpt_${Date.now().toString(36)}`,
    });

    // Returning the quote lets the client show the authoritative figures and
    // reconcile them against what it displayed.
    return ok({
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: credentials.keyId,
      quote,
    });
  } catch (e) {
    if (e instanceof PricingError) return bad(e.message, e.status);
    return server(e);
  }
}
