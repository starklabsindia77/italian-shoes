import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { SessionProvider } from "@/components/providers/SessionProvider";
import Script from "next/script";



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://italianshoescompany.com"),
  title: {
    default: "Italian Shoes",
    template: "%s | Italian Shoes",
  },
  description: "Premium handcrafted Italian shoes and leather goods.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    siteName: "Italian Shoes",
    title: "Italian Shoes",
    description: "Premium handcrafted Italian shoes and leather goods.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Italian Shoes",
    description: "Premium handcrafted Italian shoes and leather goods.",
  },
};

import { getSettings } from "@/app/api/settings/route";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();
  const {
    shiprocketFasterCheckoutEnabled,
    shiprocketStoreId,
    razorpayMagicCheckoutEnabled,
    razorpayKeyId
  } = settings.integrations;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <div className="min-h-screen flex flex-col">
            <main className="flex-grow">
              {children}
            </main>
          </div>
          {/* 👇 Required for sonner toasts */}
          <Toaster richColors position="top-center" />

          {/* Shiprocket Faster Checkout */}
          {shiprocketFasterCheckoutEnabled && (
            <>
              <Script
                src="https://fastrr-boost-ui.shiprocket.in/assets/js/sdk.js"
                strategy="afterInteractive"
              />
              <Script
                id="shiprocket-fastrr-config"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                  __html: `
                    window.fastrr_config = {
                      "app_id": "${shiprocketStoreId}",
                      "is_sandbox": true
                    };
                  `,
                }}
              />
            </>
          )}

          {/* Razorpay Magic Checkout */}
          {razorpayMagicCheckoutEnabled && (
            <Script
              src="https://checkout.razorpay.com/v1/magic-checkout.js"
              strategy="afterInteractive"
              onLoad={() => {
                // Initial configuration if needed
                (window as any).RazorpayMagicCheckout?.init({
                  key_id: razorpayKeyId,
                });
              }}
            />
          )}
        </SessionProvider>
      </body>
    </html>
  );
}
