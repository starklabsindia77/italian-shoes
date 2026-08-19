// app/api/settings/route.ts
import { NextResponse } from "next/server";
import {
  getSettings,
  readSettingsFromDb,
  writeSettingsToDb,
  deepMerge,
  stripBlankSecrets,
  SETTINGS_DEFAULTS,
} from "@/lib/settings";
import { requirePermission, server, bad } from "@/lib/api-helpers";

type PlainObject = Record<string, unknown>;

// Dev-only fallback for when the settings table does not exist yet. Per-instance,
// so it is never a source of truth in production.
let MEMORY_CACHE: PlainObject | null = null;

/** Secrets must never reach the client; GET is intentionally public so the
 *  storefront can read theme, currency and localization settings. */
function redactSecrets(settings: typeof SETTINGS_DEFAULTS) {
  const out = deepMerge(settings as unknown as PlainObject, {}) as typeof SETTINGS_DEFAULTS;
  const integrations = out.integrations as PlainObject | undefined;
  if (integrations) delete integrations.razorpayKeySecret;
  const email = out.email as PlainObject | undefined;
  if (email) {
    delete email.resendApiKey;
    delete email.smtpPass;
  }
  return out;
}

export async function GET() {
  try {
    const db = await readSettingsFromDb();
    const merged = deepMerge(
      SETTINGS_DEFAULTS as unknown as PlainObject,
      (db as PlainObject) ?? MEMORY_CACHE ?? {}
    ) as typeof SETTINGS_DEFAULTS;
    return NextResponse.json(redactSecrets(merged));
  } catch (e) {
    return server(e);
  }
}

export async function PUT(req: Request) {
  try {
    await requirePermission("settings.manage");

    const raw = await req.json().catch(() => null);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return bad("Invalid JSON body");
    }
    const patch = raw as PlainObject;

    if (patch.syncRates) {
      const current = await getSettings();
      const { fetchExchangeRates } = await import("@/lib/currency");
      const newRates = await fetchExchangeRates("INR");
      const updated = deepMerge(current as unknown as PlainObject, {
        localization: { rates: newRates, lastUpdated: new Date().toISOString() },
      });
      if (!(await writeSettingsToDb(updated))) MEMORY_CACHE = updated;
      return NextResponse.json(redactSecrets(updated as typeof SETTINGS_DEFAULTS));
    }

    // Merge precedence: defaults <- stored <- patch, recursively, so a patch
    // touching one field cannot delete its siblings.
    const db = await readSettingsFromDb();
    const base = deepMerge(
      SETTINGS_DEFAULTS as unknown as PlainObject,
      (db as PlainObject) ?? MEMORY_CACHE ?? {}
    );
    const merged = deepMerge(base, stripBlankSecrets(patch));

    if (!(await writeSettingsToDb(merged))) MEMORY_CACHE = merged;

    return NextResponse.json(redactSecrets(merged as typeof SETTINGS_DEFAULTS));
  } catch (e) {
    return server(e);
  }
}
