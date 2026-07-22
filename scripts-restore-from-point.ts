import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

const RESTORE_DIR = "/home/z/my-project/db-restore-point";

async function restore(restorePointId: string) {
  const dir = path.join(RESTORE_DIR, restorePointId);
  if (!fs.existsSync(dir)) {
    console.error(`Restore point not found: ${dir}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf-8"));
  console.log(`Restoring from: ${restorePointId}`);
  console.log(`Description: ${manifest.description}`);
  console.log(`Timestamp: ${manifest.timestamp}\n`);

  // Products
  const products = JSON.parse(fs.readFileSync(path.join(dir, "products.json"), "utf-8"));
  console.log(`Restoring ${products.length} products...`);
  for (const p of products) {
    await db.product.upsert({
      where: { id: p.id },
      create: p,
      update: p,
    });
  }
  console.log("✓ Products restored");

  // Categories
  const categories = JSON.parse(fs.readFileSync(path.join(dir, "categories.json"), "utf-8"));
  for (const c of categories) {
    await db.category.upsert({ where: { id: c.id }, create: c, update: c });
  }
  console.log(`✓ ${categories.length} categories restored`);

  // Payment Gateways
  const gateways = JSON.parse(fs.readFileSync(path.join(dir, "paymentGateways.json"), "utf-8"));
  for (const g of gateways) {
    await db.paymentGateway.upsert({ where: { slug: g.slug }, create: g, update: g });
  }
  console.log(`✓ ${gateways.length} payment gateways restored`);

  console.log("\n✓ Restore complete!");
}

const id = process.argv[2];
if (!id) {
  console.log("Usage: bunx tsx scripts-restore-from-point.ts <restore-point-id>");
  console.log("Available restore points:");
  if (fs.existsSync(RESTORE_DIR)) {
    fs.readdirSync(RESTORE_DIR).forEach(d => console.log(`  - ${d}`));
  }
  process.exit(0);
}
restore(id).catch(console.error).finally(() => process.exit(0));
