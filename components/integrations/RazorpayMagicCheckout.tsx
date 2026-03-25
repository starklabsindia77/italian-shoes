"use client";

import Script from "next/script";

interface RazorpayMagicCheckoutProps {
    razorpayKeyId: string;
}

export const RazorpayMagicCheckout = ({ razorpayKeyId }: RazorpayMagicCheckoutProps) => {
    return (
        <Script
            src="https://checkout.razorpay.com/v1/magic-checkout.js"
            strategy="afterInteractive"
            onLoad={() => {
                (window as any).RazorpayMagicCheckout?.init({
                    key_id: razorpayKeyId,
                });
            }}
        />
    );
};
