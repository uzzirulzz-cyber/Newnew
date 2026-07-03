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
    icon: "/favicon.png",
    apple: "/favicon.png",
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
