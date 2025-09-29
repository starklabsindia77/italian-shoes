import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { SessionProvider } from "@/components/providers/SessionProvider";



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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
        </SessionProvider>
      </body>
    </html>
  );
}
