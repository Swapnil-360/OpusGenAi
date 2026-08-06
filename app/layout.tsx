import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/app/providers";
import { AnalyticsClient } from "@/components/shared/AnalyticsClient";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://opusgenai.vercel.app";
const SITE_TITLE = "OpusGen AI — Studio-Quality Product Photography";
const SITE_DESCRIPTION =
  "Create stunning product content in minutes. AI-powered photography, background tools, and social media captions — built for e-commerce brands.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s — OpusGen AI",
  },
  description: SITE_DESCRIPTION,
  keywords: "AI product photography, background removal, e-commerce images, product photos AI",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/logo/2-removebg-preview.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/logo/2-removebg-preview.png",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "OpusGen AI",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          {children}
          <Toaster />
        </Providers>
        <AnalyticsClient />
      </body>
    </html>
  );
}
