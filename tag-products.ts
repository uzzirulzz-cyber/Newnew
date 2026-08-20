import { db } from "./src/lib/db";
async function main() {
  const products = await db.product.findMany({ select: { id: true, slug: true, featured: true } });
  console.log(`${products.length} products`);
  for (const p of products) {
    const tags = p.featured || p.slug.startsWith("zb-") ? ["best-sellers","limited-time-offers","flash-deals"] : ["trending-this-week","best-sellers"];
    await db.product.update({ where: { id: p.id }, data: { tags: JSON.stringify(tags) } });
  }
  console.log("done");
  await db.$disconnect();
}
main();
