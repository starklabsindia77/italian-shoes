import { prisma } from "@/lib/prisma";
import { ok, bad, server } from "@/lib/api-helpers";
import { getCashfreeCredentials, verifyCashfreeWebhookSignature } from "@/lib/cashfree";

/**
 * Cashfree payment webhook (configure in Cashfree dashboard → Developers →
 * Webhooks, pointing at /api/cashfree/webhook).
 *
 * Orders are only written after the browser hands back the design data, so a
 * shopper who pays and then closes the tab leaves a payment with no order. This
 * hook exists to surface exactly that case in the logs for manual follow-up;
 * it never creates or marks orders itself.
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();

    const credentials = await getCashfreeCredentials();
    if (!credentials) return bad("Cashfree is not configured", 503);

    const valid = verifyCashfreeWebhookSignature({
      rawBody,
      timestamp: req.headers.get("x-webhook-timestamp"),
      signature: req.headers.get("x-webhook-signature"),
      secretKey: credentials.secretKey,
    });
    if (!valid) {
      console.warn("cashfree/webhook-bad-signature");
      return bad("Invalid signature", 401);
    }

    const event = JSON.parse(rawBody) as {
      type?: string;
      data?: {
        order?: { order_id?: string; order_amount?: number };
        payment?: { cf_payment_id?: string | number; payment_status?: string };
      };
    };

    const orderId = event.data?.order?.order_id;
    const paymentStatus = event.data?.payment?.payment_status;

    if (orderId && paymentStatus === "SUCCESS") {
      // A missing row can also mean the browser's save is still in flight, so
      // this is a warning to investigate, not an automatic action.
      const existing = await prisma.order.findUnique({ where: { orderId }, select: { id: true } });
      if (!existing) {
        console.warn("cashfree/paid-without-order", {
          orderId,
          cfPaymentId: event.data?.payment?.cf_payment_id,
          amount: event.data?.order?.order_amount,
        });
      }
    } else {
      console.info("cashfree/webhook", { type: event.type, orderId, paymentStatus });
    }

    return ok({ received: true });
  } catch (e) {
    return server(e);
  }
}
