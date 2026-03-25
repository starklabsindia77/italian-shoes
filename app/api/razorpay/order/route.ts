import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getSettings } from "@/lib/settings";

export async function POST(req: Request) {
    try {
        const { amount, currency = "INR" } = await req.json();

        if (!amount) {
            return NextResponse.json({ error: "Amount is required" }, { status: 400 });
        }

        const settings = await getSettings();
        const { razorpayKeyId: settingsKeyId, razorpayKeySecret: settingsKeySecret } = settings.integrations;

        // Use DB settings if available, otherwise fallback to environment variables
        const finalKeyId = settingsKeyId || process.env.RAZORPAY_KEY_ID;
        const finalKeySecret = settingsKeySecret || process.env.RAZORPAY_KEY_SECRET;

        if (!finalKeyId || !finalKeySecret) {
            return NextResponse.json(
                { error: "Razorpay keys not configured. Please set them in admin settings or environment variables." },
                { status: 500 }
            );
        }

        const razorpay = new Razorpay({
            key_id: finalKeyId,
            key_secret: finalKeySecret,
        });

        const options = {
            amount: Math.round(amount * 100), // Razorpay expects amount in paise (cents)
            currency,
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json(order);
    } catch (error: any) {
        console.error("Razorpay order creation error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create Razorpay order" },
            { status: 500 }
        );
    }
}
