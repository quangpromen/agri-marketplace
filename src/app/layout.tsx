import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { constructMetadata } from "@/lib/metadata";
import { siteConfig } from "@/config/site";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = constructMetadata();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    alternateName: "Mộc Farm Việt Nam",
    url: siteConfig.url,
    logo: `${siteConfig.url}/images/hero/hero-1.jpg`,
    description: siteConfig.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Thôn Đa Lộc, Xã Đạ Nhim",
      addressLocality: "Huyện Lạc Dương",
      addressRegion: "Tỉnh Lâm Đồng",
      addressCountry: "VN",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+84-912-345-678",
      contactType: "customer service",
      availableLanguage: ["Vietnamese"],
    },
    sameAs: [siteConfig.links.facebook, siteConfig.links.zalo, siteConfig.links.youtube],
  };

  return (
    <html lang="vi" className={`${beVietnamPro.variable} overflow-x-hidden`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen overflow-x-hidden bg-background font-sans text-foreground antialiased selection:bg-secondary/30 selection:text-foreground">
        {/* Skip to main content link for keyboard accessibility */}
        <a
          href="#main-content"
          className="sr-only z-50 rounded-md bg-primary px-4 py-2 font-medium text-cream shadow-lg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Chuyển đến nội dung chính
        </a>
        {children}
      </body>
    </html>
  );
}
