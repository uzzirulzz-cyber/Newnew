import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — PlayBeat Digital",
  description: "Admin portal — restricted access",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
