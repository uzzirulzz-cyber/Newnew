/**
 * No-op seed guard.
 *
 * The storefront shows ONLY products from your Lemon Squeezy store (fetched
 * live via the LS API). It does NOT need the database to function.
 *
 * The database is used only by admin/analytics routes. We intentionally do
 * NOT seed or query the DB here so that DB connection issues (Neon cold
 * starts, env loading delays) never block product fetching or crash the
 * storefront.
 */
export async function ensureSeeded(): Promise<void> {
  return;
}
