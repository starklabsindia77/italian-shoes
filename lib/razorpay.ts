// Note: `node:crypto` is imported with the protocol prefix on purpose. The
// dependency list contains the deprecated `crypto` placeholder package, which
// can otherwise shadow Node's built-in module during bundling.
import { createHmac, timingSafeEqual } from "node:crypto";
import { getSettings } from "@/lib/settings";

export type RazorpayCredentials = { keyId: string; keySecret: string };

/** DB settings win over env so the admin UI stays authoritative. */
export async function getRazorpayCredentials(): Promise<RazorpayCredentials | null> {
  const settings = await getSettings();
  const keyId = settings.integrations?.razorpayKeyId || process.env.RAZORPAY_KEY_ID;
  const keySecret = settings.integrations?.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

/**
 * Verifies the checkout callback actually came from Razorpay.
 *
 * Razorpay signs `<order_id>|<payment_id>` with HMAC-SHA256 keyed on the API
 * secret. Without this check any caller can POST a fabricated payment result
 * and have the order recorded as paid.
 */
export function verifyPaymentSignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
  keySecret: string;
}): boolean {
  const { razorpayOrderId, razorpayPaymentId, signature, keySecret } = params;
  if (!razorpayOrderId || !razorpayPaymentId || !signature) return false;

  const expected = createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const providedBuf = Buffer.from(signature, "utf8");
  // timingSafeEqual throws on length mismatch, so compare lengths first.
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}
