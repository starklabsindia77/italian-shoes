import { prisma } from "@/lib/prisma";

export const SETTINGS_DEFAULTS = {
  general: {
    storeName: "Italian Shoes",
    supportEmail: "support@italianshoes.com",
    supportPhone: "+1 (555) 123-4567",
    timezone: "Europe/Rome",
    storefrontUrl: "https://example.com",
    notes: "",
  },
  currency: { defaultCurrency: "USD" as "USD" | "EUR" | "GBP", multiCurrency: true },
  taxes: { enabled: true, taxInclusive: false, defaultRate: 18 },
  integrations: {
    shiprocketEmail: "",
    shiprocketStatus: "disconnected" as "connected" | "disconnected",
    shiprocketStoreId: "",
    shiprocketFasterCheckoutEnabled: false,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
    razorpayKeySecret: "",
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
    rates: { "USD": 0.012, "EUR": 0.011, "GBP": 0.0094, "INR": 1 }, // Fallback rates
    lastUpdated: new Date().toISOString(),
  },
  email: {
    provider: "resend" as "resend" | "smtp" | "none",
    from: "Italian Shoes <orders@updates.starklabs.in>",
    resendApiKey: process.env.RESEND_API_KEY || "",
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPass: "",
    smtpSecure: true,
  }
};

const KEY = "app_settings";

function getKvModel(): unknown | null {
  const c = prisma as unknown as { setting?: unknown; config?: unknown; appSetting?: unknown; systemSetting?: unknown };
  return c?.setting ?? c?.config ?? c?.appSetting ?? c?.systemSetting ?? null;
}

export async function readSettingsFromDb() {
  try {
    const kv = getKvModel() as { findUnique?: (args: { where: { key: string } }) => Promise<{ value: unknown } | null> };
    if (!kv?.findUnique) return null;
    const row = await kv.findUnique({ where: { key: KEY } });
    if (row && row.value) return row.value;
  } catch {
    // table may not exist yet
  }
  return null;
}

export async function writeSettingsToDb(value: unknown) {
  try {
    const kv = getKvModel() as { upsert?: (args: { where: { key: string }; create: { key: string; value: unknown }; update: { value: unknown } }) => Promise<unknown> };
    if (!kv?.upsert) return false;
    await kv.upsert({
      where: { key: KEY },
      create: { key: KEY, value },
      update: { value },
    });
    return true;
  } catch {
    return false;
  }
}

type PlainObject = Record<string, unknown>;

function isPlainObject(v: unknown): v is PlainObject {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Settings are stored as a single JSON blob, so a top-level spread means a
 * patch like `{ integrations: { razorpayKeyId } }` silently deletes every other
 * key under `integrations`. Merge recursively instead; arrays are replaced
 * wholesale (shipping methods, supported countries) rather than concatenated.
 */
export function deepMerge<T extends PlainObject>(base: T, patch: PlainObject): T {
  const out: PlainObject = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    const current = out[key];
    out[key] = isPlainObject(value) && isPlainObject(current)
      ? deepMerge(current, value)
      : value;
  }
  return out as T;
}

/**
 * GET /api/settings redacts secrets, so a round-tripped form posts them back as
 * `""`. Treat blank secrets as "unchanged" so saving an unrelated field cannot
 * erase a stored credential.
 */
const SECRET_PATHS: Array<[section: string, key: string]> = [
  ["integrations", "razorpayKeySecret"],
  ["email", "resendApiKey"],
  ["email", "smtpPass"],
];

export function stripBlankSecrets(patch: PlainObject): PlainObject {
  const out: PlainObject = { ...patch };
  for (const [section, key] of SECRET_PATHS) {
    const value = out[section];
    if (!isPlainObject(value)) continue;
    if (value[key] === "" || value[key] === null) {
      const copy = { ...value };
      delete copy[key];
      out[section] = copy;
    }
  }
  return out;
}

export async function getSettings() {
  const db = await readSettingsFromDb();
  return deepMerge(SETTINGS_DEFAULTS as unknown as PlainObject, (db as PlainObject) ?? {}) as
    typeof SETTINGS_DEFAULTS;
}
