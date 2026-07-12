import React from "react";
import Header from "@/components/public/header";
import Footer from "@/components/public/footer";
import AnnouncementBar from "@/components/public/announcementBar";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f0f0f0', margin: 0, padding: 0 }}>

      {/* ── Announcement bar — full-width dark navy, sits above the white container ── */}
      <AnnouncementBar />

      {/* ── Single unified white container: header + page content ── */}
      <div
        className="grow max-w-[1140px] w-full mx-auto flex flex-col mb-12"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #d1d5db',
          boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
        }}
      >
        {/* Header (hotline row + logo/search row + nav bar) */}
        <Header />

        {/* Page content (breadcrumb, hero, product grid, etc.) */}
        <main className="grow px-4 py-6">
          {children}
        </main>
      </div>

      <Footer />
    </div>
  );
}
