import { z } from "zod";
import { ok, bad, server } from "@/lib/api-helpers";
import {
  getCashfreeCredentials,
  createCashfreeOrder,
  newCashfreeOrderId,
  normaliseIndianPhone,
  CashfreeError,
} from "@/lib/cashfree";
import { quoteCart, PricingError, BASE_CURRENCY } from "@/lib/pricing";

/**
 * Opens a Cashfree order for the cart. As with Razorpay, the client sends what
 * it wants to buy — never what it costs; the amount comes from `quoteCart`.
 *
 * Cashfree (unlike Razorpay) requires customer email + phone up front.
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
  customer: z.object({
    email: z.string().email(),
    phone: z.string().min(1),
    name: z.string().optional(),
  }),
});

export async function POST(req: Request) {
  try {
    const raw = await req.json().catch(() => null);
    const parsed = CreateOrderSchema.safeParse(raw);
    if (!parsed.success) return bad(parsed.error.message);
    const d = parsed.data;

    const phone = normaliseIndianPhone(d.customer.phone);
    if (!phone) return bad("Please enter a valid 10-digit Indian mobile number.");

    const credentials = await getCashfreeCredentials();
    if (!credentials) {
      return bad(
        "Cashfree keys are not configured. Set them in admin settings or the environment.",
        503
      );
    }

    const quote = await quoteCart({
      items: d.items,
      shippingMethodId: d.shippingMethodId ?? null,
    });
    if (quote.total <= 0) return bad("Order total must be greater than zero");

    const orderId = newCashfreeOrderId();
    // Behind the load balancer `req.url` carries the internal host, so prefer
    // the configured public URL.
    const origin = (process.env.NEXTAUTH_URL || new URL(req.url).origin).replace(/\/$/, "");

    const order = await createCashfreeOrder(credentials, {
      orderId,
      // Cashfree takes major units (rupees, up to 2 decimals).
      amount: Math.round(quote.total * 100) / 100,
      currency: BASE_CURRENCY,
      customer: {
        // Stable per customer without exposing the email as an identifier.
        id: `c_${phone}`,
        email: d.customer.email,
        phone,
        name: d.customer.name,
      },
      // Only used if a payment method escapes the modal and does a full-page
      // redirect; the checkout page resumes from `cf_order_id`.
      returnUrl: `${origin}/checkout?cf_order_id={order_id}`,
    });

    return ok({
      cashfreeOrderId: order.order_id,
      paymentSessionId: order.payment_session_id,
      environment: credentials.environment,
      amount: order.order_amount,
      currency: order.order_currency,
      quote,
    });
  } catch (e) {
    if (e instanceof PricingError) return bad(e.message, e.status);
    if (e instanceof CashfreeError) return bad(e.message, e.status);
    return server(e);
  }
}
