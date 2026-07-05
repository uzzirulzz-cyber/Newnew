import { redirect } from "next/navigation";

/**
 * /marketplace → /
 *
 * The marketplace IS the storefront now — both the marketing hero and
 * the product grid live on the home page (/). This route redirects
 * any old links to the home page.
 *
 * Category filtering still works via query params:
 *   /marketplace?category=games → /?category=games
 */
export default function MarketplacePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === "string") params.set(k, v);
  }
  const qs = params.toString();
  redirect(qs ? `/?${qs}` : "/");
}
