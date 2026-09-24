// app/api/admin/payment-settings/route.ts
//
// Customer-facing payment method configuration. Backed by the existing
// `app_settings` blob (lib/settings.ts) rather than a new table, and guarded by
// the project's existing permission system — no separate auth.
//
// The storefront does not call this route: `GET /api/settings` already returns
// the `payments` section (it holds no secrets), so checkout reads it there.
import { NextResponse } from "next/server";
import {
  readSettingsFromDb,
  writeSettingsToDb,
  deepMerge,
  SETTINGS_DEFAULTS,
} from "@/lib/settings";
import { requirePermission, server, bad } from "@/lib/api-helpers";
import { PaymentSettingsUpdateSchema } from "@/lib/validators";

type PlainObject = Record<string, unknown>;

async function readPayments() {
  const db = await readSettingsFromDb();
  const merged = deepMerge(
    SETTINGS_DEFAULTS as unknown as PlainObject,
    (db as PlainObject) ?? {}
  ) as typeof SETTINGS_DEFAULTS;
  return merged.payments;
}

export async function GET() {
  try {
    await requirePermission("settings.manage");
    const payments = await readPayments();
    return NextResponse.json({ codEnabled: payments.codEnabled });
  } catch (e) {
    return server(e);
  }
}

export async function PATCH(req: Request) {
  try {
    await requirePermission("settings.manage");

    const raw = await req.json().catch(() => null);
    const parsed = PaymentSettingsUpdateSchema.safeParse(raw);
    if (!parsed.success) return bad(parsed.error.message);

    // Merge into the stored blob so unrelated settings are preserved.
    const db = await readSettingsFromDb();
    const base = deepMerge(
      SETTINGS_DEFAULTS as unknown as PlainObject,
      (db as PlainObject) ?? {}
    );
    const merged = deepMerge(base, { payments: { codEnabled: parsed.data.codEnabled } });

    const written = await writeSettingsToDb(merged);
    if (!written) return bad("Could not save payment settings. Please try again.", 500);

    return NextResponse.json({
      success: true,
      message: `Cash on Delivery ${parsed.data.codEnabled ? "enabled" : "disabled"} successfully`,
      codEnabled: parsed.data.codEnabled,
    });
  } catch (e) {
    return server(e);
  }
}
