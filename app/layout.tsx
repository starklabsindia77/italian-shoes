import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Toaster } from "sonner";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { CurrencyProvider } from "@/components/providers/CurrencyProvider";
import Script from "next/script";
import { getSettings } from "@/lib/settings";
import { RazorpayMagicCheckout } from "@/components/integrations/RazorpayMagicCheckout";

// GeistSans and GeistMono are already configured as variables in the package
const geistSans = GeistSans;
const geistMono = GeistMono;

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
          <CurrencyProvider>
            <div className="min-h-screen flex flex-col">
              <main className="flex-grow">
                {children}
              </main>
            </div>
          </CurrencyProvider>
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
            <RazorpayMagicCheckout razorpayKeyId={razorpayKeyId} />
          )}
        </SessionProvider>
      </body>
    </html>
  );
}
