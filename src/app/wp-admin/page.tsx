import type { Metadata } from "next";
import { WordPressAdmin } from "@/components/playbeat/wordpress-admin";

export const metadata: Metadata = {
  title: "WP Admin — PlayBeat Digital",
  robots: { index: false, follow: false },
};

export default function WpAdminPage() {
  return <WordPressAdmin />;
}
