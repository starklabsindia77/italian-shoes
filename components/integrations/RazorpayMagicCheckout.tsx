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
                (window as unknown as { RazorpayMagicCheckout?: { init: (config: { key_id: string }) => void } }).RazorpayMagicCheckout?.init({
                    key_id: razorpayKeyId,
                });
            }}
        />
    );
};
