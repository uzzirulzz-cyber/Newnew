import { redirect } from "next/navigation";

/**
 * /ai-tools → /?category=ai-tools
 *
 * Redirects to the home page (storefront) filtered to the AI Tools category.
 */
export default function AIToolsPage() {
  redirect("/?category=ai-tools");
}
