import { db } from "@/lib/db";
async function main() {
  const products = await db.product.findMany({
    select: { id: true, title: true, price: true, discountPrice: true, currency: true, status: true, cover: true },
    orderBy: { title: 'asc' }
  });
  console.log(`Total products: ${products.length}\n`);
  console.log("TITLE | PRICE | DISCOUNT | CURRENCY | STATUS | COVER");
  console.log("-".repeat(120));
  for (const p of products) {
    const cover = p.cover ? (p.cover.startsWith("http") ? "URL" : p.cover.startsWith("{") ? "JSON" : "LOCAL") : "NONE";
    console.log(`${p.title} | Rs ${p.price} | ${p.discountPrice ? 'Rs '+p.discountPrice : '—'} | ${p.currency} | ${p.status} | ${cover}`);
  }
  console.log(`\nTotal catalog value: Rs ${products.reduce((s, p) => s + p.price, 0).toLocaleString()}`);
}
main().catch(console.error).finally(() => process.exit(0));
