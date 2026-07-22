import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Admin — PlayBeat Digital",
  description: "Admin portal — restricted access",
  manifest: "/manifests/admin-manifest.json",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PB Admin",
  },
  icons: {
    icon: "/icons/admin-icon-192.png",
    apple: "/icons/admin-icon-180.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function WpAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw/admin-sw.js')
                  .then(() => console.log('[PWA] Service Worker registered'))
                  .catch((e) => console.log('[PWA] SW registration failed:', e));
              });
            }
          `,
        }}
      />
      {children}
    </>
  );
}
