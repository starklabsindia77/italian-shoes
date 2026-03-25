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

function getKvModel(): any | null {
  const c = prisma as any;
  return c?.setting ?? c?.config ?? c?.appSetting ?? c?.systemSetting ?? null;
}

export async function readSettingsFromDb() {
  try {
    const kv = getKvModel();
    if (!kv?.findUnique) return null;
    const row = await kv.findUnique({ where: { key: KEY } });
    if (row && row.value) return row.value;
  } catch {
    // table may not exist yet
  }
  return null;
}

export async function writeSettingsToDb(value: any) {
  try {
    const kv = getKvModel();
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

export async function getSettings() {
  const db = await readSettingsFromDb();
  return {
    ...SETTINGS_DEFAULTS,
    ...(db ?? {}),
  };
}
