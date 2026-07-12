import type { Metadata } from "next";
import { Space_Grotesk, Inter, Manrope } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/playbeat/theme-provider";
import { Providers } from "@/components/playbeat/providers";
import { MetaPixel } from "@/components/playbeat/meta-pixel";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-numeric",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://playbeat.digital"),
  title: {
    default: "PlayBeat Digital — Premium Digital Products Marketplace",
    template: "%s | PlayBeat Digital",
  },
  description:
    "Pakistan's premier digital marketplace for game keys, software licenses, AI tools, streaming subscriptions (Netflix, Spotify, YouTube Premium), IPTV, and gift cards. Instant delivery. JazzCash + PayPal accepted.",
  keywords: [
    "PlayBeat Digital",
    "digital marketplace Pakistan",
    "Netflix Pakistan",
    "Spotify Premium",
    "YouTube Premium",
    "AI tools",
    "software licenses",
    "IPTV",
    "game keys",
    "gift cards",
    "JazzCash",
    "digital products",
  ],
  authors: [{ name: "Playbeat Digital (Private) Limited" }],
  creator: "Playbeat Digital (Private) Limited",
  publisher: "Playbeat Digital (Private) Limited",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PlayBeat Digital — Premium Digital Products Marketplace",
    description:
      "Pakistan's premier digital marketplace for game keys, software licenses, AI tools, streaming subscriptions, IPTV, and gift cards. Instant delivery.",
    url: "https://playbeat.digital",
    siteName: "PlayBeat Digital",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "PlayBeat Digital — Premium Digital Products Marketplace",
    description:
      "Pakistan's premier digital marketplace. Instant delivery. JazzCash + PayPal accepted.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8143075550797983"
          crossOrigin="anonymous"
        />
        <meta name="google-adsense-account" content="ca-pub-8143075550797983" />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${manrope.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            {children}
            <Toaster />
            <Sonner />
            <MetaPixel />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
