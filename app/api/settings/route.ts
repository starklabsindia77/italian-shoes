// app/api/settings/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Optional KV schema (any one of these names is supported automatically):
 * model Setting      { key String @id; value Json; updatedAt DateTime @updatedAt }
 * model Config       { key String @id; value Json; updatedAt DateTime @updatedAt }
 * model AppSetting   { key String @id; value Json; updatedAt DateTime @updatedAt }
 * model SystemSetting{ key String @id; value Json; updatedAt DateTime @updatedAt }
 *
 * If none exists, this route uses an in-memory cache (fine for dev).
 */

const DEFAULTS = {
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
  integrations: { shiprocketEmail: "", shiprocketStatus: "disconnected" as "connected" | "disconnected" },
};

let MEMORY_CACHE: any | null = null;
const KEY = "app_settings";

// Try to detect whichever KV model you have without typing issues
function getKvModel(): any | null {
  const c = prisma as any;
  return c?.setting ?? c?.config ?? c?.appSetting ?? c?.systemSetting ?? null;
}

async function readFromDb() {
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

async function writeToDb(value: any) {
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

export async function GET() {
  const db = await readFromDb();
  if (db) return NextResponse.json({ ...DEFAULTS, ...db });
  if (MEMORY_CACHE) return NextResponse.json({ ...DEFAULTS, ...MEMORY_CACHE });
  return NextResponse.json(DEFAULTS);
}

export async function PUT(req: Request) {
  const patch = await req.json().catch(() => ({}));

  // merge precedence: defaults <- memory <- db <- patch
  const merged = {
    ...DEFAULTS,
    ...(MEMORY_CACHE ?? {}),
    ...((await readFromDb()) ?? {}),
    ...(patch ?? {}),
  };

  const ok = await writeToDb(merged);
  if (!ok) MEMORY_CACHE = merged; // dev fallback

  return NextResponse.json(merged);
}
