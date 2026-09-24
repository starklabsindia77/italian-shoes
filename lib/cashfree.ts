import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getSettings } from "@/lib/settings";

/**
 * Cashfree Payment Gateway (PG) — REST integration.
 *
 * We call the REST API directly rather than through the `cashfree-pg` SDK: we
 * need three endpoints and the SDK's surface changes between major versions.
 * The API version is pinned so Cashfree cannot change response shapes under us.
 */
const API_VERSION = "2023-08-01";

export type CashfreeEnvironment = "sandbox" | "production";

export type CashfreeCredentials = {
  appId: string;
  secretKey: string;
  environment: CashfreeEnvironment;
};

export class CashfreeError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

// Terraform seeds the SSM parameters with this value until the real key is set.
const PLACEHOLDER = "CHANGEME";

/**
 * Credentials are only usable as a matched pair, so both halves come from the
 * same source. Whitespace is trimmed because these are pasted by hand into the
 * admin form, and a trailing space makes Cashfree reject every call with
 * "authentication Failed".
 */
function pair(appId?: string | null, secretKey?: string | null): { appId: string; secretKey: string } | null {
  const id = appId?.trim();
  const secret = secretKey?.trim();
  if (!id || !secret || id === PLACEHOLDER || secret === PLACEHOLDER) return null;
  return { appId: id, secretKey: secret };
}

/**
 * DB settings win over env so the admin UI stays authoritative. The app id and
 * secret are taken as a pair from one source: mixing a DB app id with an env
 * secret (e.g. an admin save persisted only the id) makes Cashfree reject every
 * call with 401 "authentication Failed".
 */
export async function getCashfreeCredentials(): Promise<CashfreeCredentials | null> {
  const settings = await getSettings();
  const matched =
    pair(settings.integrations?.cashfreeAppId, settings.integrations?.cashfreeSecretKey) ??
    pair(process.env.CASHFREE_APP_ID, process.env.CASHFREE_SECRET_KEY);
  if (!matched) return null;

  const envSetting = settings.integrations?.cashfreeEnvironment || process.env.CASHFREE_ENV;
  return {
    ...matched,
    environment: envSetting === "production" ? "production" : "sandbox",
  };
}

function baseUrl(env: CashfreeEnvironment) {
  return env === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
}

async function cashfreeFetch<T>(
  creds: CashfreeCredentials,
  path: string,
  init: { method: "GET" | "POST"; body?: unknown; idempotencyKey?: string }
): Promise<T> {
  const headers: Record<string, string> = {
    "x-client-id": creds.appId,
    "x-client-secret": creds.secretKey,
    "x-api-version": API_VERSION,
    Accept: "application/json",
  };
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  if (init.idempotencyKey) headers["x-idempotency-key"] = init.idempotencyKey;

  const res = await fetch(`${baseUrl(creds.environment)}${path}`, {
    method: init.method,
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  const json = (await res.json().catch(() => null)) as
    | (T & { message?: string; code?: string; type?: string })
    | null;

  if (!res.ok || !json) {
    // 401/403 means Cashfree refused our API keys — a store misconfiguration,
    // not something the shopper did or can fix. Log the detail an operator
    // needs (never the keys themselves) and show the shopper something neutral,
    // rather than passing Cashfree's bare "authentication Failed" to checkout.
    if (res.status === 401 || res.status === 403) {
      console.error(
        "cashfree/credentials-rejected: Cashfree returned " +
          `${res.status} "${json?.message ?? "no message"}" for ${creds.environment} ` +
          `(${baseUrl(creds.environment)}). Check that the App ID and Secret Key in ` +
          "admin settings are an unmodified pair from the SAME Cashfree app and " +
          `environment, and that the account is activated for ${creds.environment}.`,
        { path, code: json?.code, type: json?.type }
      );
      throw new CashfreeError(
        "Online payment is temporarily unavailable. Please try again later or contact support.",
        503
      );
    }

    // Other Cashfree messages are safe to surface (e.g. "customer_phone is
    // invalid"); they never echo credentials.
    console.error("cashfree/api-error", { path, status: res.status, message: json?.message });
    throw new CashfreeError(json?.message || `Cashfree request failed (${res.status})`, 502);
  }
  return json;
}

/** Cashfree order ids: alphanumerics, `_` and `-`, max 45 chars. */
export function newCashfreeOrderId() {
  return `cf_${Date.now().toString(36)}_${randomBytes(6).toString("hex")}`;
}

/**
 * Cashfree requires a phone number on every order. Accept the usual Indian
 * formats (+91, leading 0, spaces, dashes) and normalise to 10 digits.
 */
export function normaliseIndianPhone(raw: string | null | undefined): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  const ten = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(ten) ? ten : null;
}

export type CashfreeOrder = {
  cf_order_id: string | number;
  order_id: string;
  order_amount: number;
  order_currency: string;
  order_status: "ACTIVE" | "PAID" | "EXPIRED" | "TERMINATED" | "TERMINATION_REQUESTED";
  payment_session_id: string;
};

export async function createCashfreeOrder(
  creds: CashfreeCredentials,
  params: {
    orderId: string;
    amount: number; // major units
    currency: string;
    customer: { id: string; email: string; phone: string; name?: string };
    returnUrl?: string;
  }
) {
  return cashfreeFetch<CashfreeOrder>(creds, "/orders", {
    method: "POST",
    idempotencyKey: params.orderId,
    body: {
      order_id: params.orderId,
      order_amount: params.amount,
      order_currency: params.currency,
      customer_details: {
        customer_id: params.customer.id,
        customer_email: params.customer.email,
        customer_phone: params.customer.phone,
        customer_name: params.customer.name || undefined,
      },
      order_meta: params.returnUrl ? { return_url: params.returnUrl } : undefined,
    },
  });
}

export async function fetchCashfreeOrder(creds: CashfreeCredentials, orderId: string) {
  return cashfreeFetch<CashfreeOrder>(creds, `/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
  });
}

/**
 * Verifies a Cashfree webhook: base64(HMAC-SHA256(timestamp + rawBody, secret)).
 * Must be computed over the raw body — re-serialised JSON will not match.
 */
export function verifyCashfreeWebhookSignature(params: {
  rawBody: string;
  timestamp: string | null;
  signature: string | null;
  secretKey: string;
}): boolean {
  const { rawBody, timestamp, signature, secretKey } = params;
  if (!timestamp || !signature) return false;
  const expected = createHmac("sha256", secretKey).update(timestamp + rawBody).digest("base64");
  const expectedBuf = Buffer.from(expected, "utf8");
  const providedBuf = Buffer.from(signature, "utf8");
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}
