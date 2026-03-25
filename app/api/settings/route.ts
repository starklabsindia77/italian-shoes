// app/api/settings/route.ts
import { NextResponse } from "next/server";
import { 
  getSettings, 
  readSettingsFromDb, 
  writeSettingsToDb, 
  SETTINGS_DEFAULTS 
} from "@/lib/settings";
import { requirePermission, server } from "@/lib/api-helpers";

let MEMORY_CACHE: any | null = null;

export async function GET() {
  try {
    await requirePermission("settings.manage");
    const db = await readSettingsFromDb();
    if (db) return NextResponse.json({ ...SETTINGS_DEFAULTS, ...db });
    if (MEMORY_CACHE) return NextResponse.json({ ...SETTINGS_DEFAULTS, ...MEMORY_CACHE });
    return NextResponse.json(SETTINGS_DEFAULTS);
  } catch (e) {
    return server(e);
  }
}

export async function PUT(req: Request) {
  try {
    await requirePermission("settings.manage");
    const patch = await req.json().catch(() => ({}));

    if (patch.syncRates) {
      const current = await getSettings();
      const { fetchExchangeRates } = await import("@/lib/currency");
      const newRates = await fetchExchangeRates("INR");
      const updated = {
        ...current,
        localization: {
          ...current.localization,
          rates: newRates,
          lastUpdated: new Date().toISOString(),
        },
      };
      await writeSettingsToDb(updated);
      MEMORY_CACHE = updated;
      return NextResponse.json(updated);
    }

    // merge precedence: defaults <- memory <- db <- patch
    const db = await readSettingsFromDb();
    const merged = {
      ...SETTINGS_DEFAULTS,
      ...(MEMORY_CACHE ?? {}),
      ...(db ?? {}),
      ...(patch ?? {}),
    };

    const ok = await writeSettingsToDb(merged);
    if (!ok) MEMORY_CACHE = merged; // dev fallback

    return NextResponse.json(merged);
  } catch (e) {
    return server(e);
  }
}
