import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/playbeat/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PlayBeat Storefront — AI Tools, Software & Digital Products Marketplace",
  description:
    "PlayBeat is a global digital marketplace for AI tools, software licenses, SaaS subscriptions, digital downloads, templates, graphics, courses and affiliate offers.",
  keywords: [
    "PlayBeat",
    "AI tools marketplace",
    "digital products",
    "software subscriptions",
    "SaaS marketplace",
    "digital downloads",
    "affiliate offers",
  ],
  authors: [{ name: "PlayBeat Inc." }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "PlayBeat Storefront",
    description:
      "The global marketplace for AI tools, software subscriptions & digital products.",
    siteName: "PlayBeat",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PlayBeat Storefront",
    description:
      "The global marketplace for AI tools, software subscriptions & digital products.",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <Sonner />
        </ThemeProvider>
      </body>
    </html>
  );
}
