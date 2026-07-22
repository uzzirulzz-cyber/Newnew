import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

const RESTORE_DIR = "/home/z/my-project/db-restore-point";
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0] + "T" + new Date().toISOString().replace(/[:.]/g, "-").split("T")[1].split("-").slice(0,2).join("-");

async function snapshot() {
  console.log("=".repeat(60));
  console.log("PLAYBEAT DIGITAL — CREATING DATABASE RESTORE POINT");
  console.log("=".repeat(60));
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Restore dir: ${RESTORE_DIR}`);
  console.log("");

  // Create restore directory
  const dir = path.join(RESTORE_DIR, TIMESTAMP);
  fs.mkdirSync(dir, { recursive: true });
  console.log(`✓ Created restore directory: ${dir}`);

  const manifest: any = {
    timestamp: new Date().toISOString(),
    restorePointId: TIMESTAMP,
    description: "Default e-store mode — JazzCash LIVE + 29 PKR products + silver/gold text logo",
    tables: {},
  };

  // 1. Products (CRITICAL — 29 products with PKR prices + cover URLs)
  console.log("\n📦 Snapshotting products...");
  const products = await db.product.findMany();
  fs.writeFileSync(path.join(dir, "products.json"), JSON.stringify(products, null, 2));
  manifest.tables.products = { count: products.length, file: "products.json" };
  console.log(`   ✓ ${products.length} products saved`);

  // 2. Categories
  console.log("📂 Snapshotting categories...");
  const categories = await db.category.findMany();
  fs.writeFileSync(path.join(dir, "categories.json"), JSON.stringify(categories, null, 2));
  manifest.tables.categories = { count: categories.length, file: "categories.json" };
  console.log(`   ✓ ${categories.length} categories saved`);

  // 3. Vendors
  console.log("🏪 Snapshotting vendors...");
  const vendors = await db.vendor.findMany();
  fs.writeFileSync(path.join(dir, "vendors.json"), JSON.stringify(vendors, null, 2));
  manifest.tables.vendors = { count: vendors.length, file: "vendors.json" };
  console.log(`   ✓ ${vendors.length} vendors saved`);

  // 4. Orders
  console.log("🛒 Snapshotting orders...");
  const orders = await db.order.findMany();
  fs.writeFileSync(path.join(dir, "orders.json"), JSON.stringify(orders, null, 2));
  manifest.tables.orders = { count: orders.length, file: "orders.json" };
  console.log(`   ✓ ${orders.length} orders saved`);

  // 5. Order Items
  console.log("📝 Snapshotting order items...");
  const orderItems = await db.orderItem.findMany();
  fs.writeFileSync(path.join(dir, "orderItems.json"), JSON.stringify(orderItems, null, 2));
  manifest.tables.orderItems = { count: orderItems.length, file: "orderItems.json" };
  console.log(`   ✓ ${orderItems.length} order items saved`);

  // 6. Payments
  console.log("💳 Snapshotting payments...");
  const payments = await db.payment.findMany();
  fs.writeFileSync(path.join(dir, "payments.json"), JSON.stringify(payments, null, 2));
  manifest.tables.payments = { count: payments.length, file: "payments.json" };
  console.log(`   ✓ ${payments.length} payments saved`);

  // 7. Payment Gateways (CRITICAL — JazzCash config)
  console.log("🏦 Snapshotting payment gateways...");
  const gateways = await db.paymentGateway.findMany();
  fs.writeFileSync(path.join(dir, "paymentGateways.json"), JSON.stringify(gateways, null, 2));
  manifest.tables.paymentGateways = { count: gateways.length, file: "paymentGateways.json" };
  console.log(`   ✓ ${gateways.length} payment gateways saved`);

  // 8. Transactions
  console.log("💰 Snapshotting transactions...");
  const transactions = await db.transaction.findMany();
  fs.writeFileSync(path.join(dir, "transactions.json"), JSON.stringify(transactions, null, 2));
  manifest.tables.transactions = { count: transactions.length, file: "transactions.json" };
  console.log(`   ✓ ${transactions.length} transactions saved`);

  // 9. Users
  console.log("👥 Snapshotting users...");
  const users = await db.user.findMany();
  fs.writeFileSync(path.join(dir, "users.json"), JSON.stringify(users, null, 2));
  manifest.tables.users = { count: users.length, file: "users.json" };
  console.log(`   ✓ ${users.length} users saved`);

  // 10. Settings
  console.log("⚙️  Snapshotting settings...");
  const settings = await db.settings.findMany();
  fs.writeFileSync(path.join(dir, "settings.json"), JSON.stringify(settings, null, 2));
  manifest.tables.settings = { count: settings.length, file: "settings.json" };
  console.log(`   ✓ ${settings.length} settings saved`);

  // 11. Coupons
  console.log("🏷️  Snapshotting coupons...");
  const coupons = await db.coupon.findMany();
  fs.writeFileSync(path.join(dir, "coupons.json"), JSON.stringify(coupons, null, 2));
  manifest.tables.coupons = { count: coupons.length, file: "coupons.json" };
  console.log(`   ✓ ${coupons.length} coupons saved`);

  // 12. Reviews
  console.log("⭐ Snapshotting reviews...");
  const reviews = await db.review.findMany();
  fs.writeFileSync(path.join(dir, "reviews.json"), JSON.stringify(reviews, null, 2));
  manifest.tables.reviews = { count: reviews.length, file: "reviews.json" };
  console.log(`   ✓ ${reviews.length} reviews saved`);

  // 13. Favorites
  console.log("❤️  Snapshotting favorites...");
  const favorites = await db.favorite.findMany();
  fs.writeFileSync(path.join(dir, "favorites.json"), JSON.stringify(favorites, null, 2));
  manifest.tables.favorites = { count: favorites.length, file: "favorites.json" };
  console.log(`   ✓ ${favorites.length} favorites saved`);

  // 14. Notifications
  console.log("🔔 Snapshotting notifications...");
  const notifications = await db.notification.findMany();
  fs.writeFileSync(path.join(dir, "notifications.json"), JSON.stringify(notifications, null, 2));
  manifest.tables.notifications = { count: notifications.length, file: "notifications.json" };
  console.log(`   ✓ ${notifications.length} notifications saved`);

  // 15. Affiliates
  console.log("🤝 Snapshotting affiliates...");
  const affiliates = await db.affiliate.findMany();
  fs.writeFileSync(path.join(dir, "affiliates.json"), JSON.stringify(affiliates, null, 2));
  manifest.tables.affiliates = { count: affiliates.length, file: "affiliates.json" };
  console.log(`   ✓ ${affiliates.length} affiliates saved`);

  // 16. IPTV Channels
  console.log("📺 Snapshotting IPTV channels...");
  const iptvChannels = await db.iptvChannel.findMany();
  fs.writeFileSync(path.join(dir, "iptvChannels.json"), JSON.stringify(iptvChannels, null, 2));
  manifest.tables.iptvChannels = { count: iptvChannels.length, file: "iptvChannels.json" };
  console.log(`   ✓ ${iptvChannels.length} IPTV channels saved`);

  // 17. Subscriptions
  console.log("📱 Snapshotting subscriptions...");
  const subscriptions = await db.subscription.findMany();
  fs.writeFileSync(path.join(dir, "subscriptions.json"), JSON.stringify(subscriptions, null, 2));
  manifest.tables.subscriptions = { count: subscriptions.length, file: "subscriptions.json" };
  console.log(`   ✓ ${subscriptions.length} subscriptions saved`);

  // 18. Support Tickets
  console.log("🎫 Snapshotting support tickets...");
  const tickets = await db.supportTicket.findMany();
  fs.writeFileSync(path.join(dir, "supportTickets.json"), JSON.stringify(tickets, null, 2));
  manifest.tables.supportTickets = { count: tickets.length, file: "supportTickets.json" };
  console.log(`   ✓ ${tickets.length} support tickets saved`);

  // 19. API Keys
  console.log("🔑 Snapshotting API keys...");
  const apiKeys = await db.apiKey.findMany();
  fs.writeFileSync(path.join(dir, "apiKeys.json"), JSON.stringify(apiKeys, null, 2));
  manifest.tables.apiKeys = { count: apiKeys.length, file: "apiKeys.json" };
  console.log(`   ✓ ${apiKeys.length} API keys saved`);

  // 20. Webhooks
  console.log("🔗 Snapshotting webhooks...");
  const webhooks = await db.webhook.findMany();
  fs.writeFileSync(path.join(dir, "webhooks.json"), JSON.stringify(webhooks, null, 2));
  manifest.tables.webhooks = { count: webhooks.length, file: "webhooks.json" };
  console.log(`   ✓ ${webhooks.length} webhooks saved`);

  // 21. Audit Logs
  console.log("📋 Snapshotting audit logs...");
  const auditLogs = await db.auditLog.findMany();
  fs.writeFileSync(path.join(dir, "auditLogs.json"), JSON.stringify(auditLogs, null, 2));
  manifest.tables.auditLogs = { count: auditLogs.length, file: "auditLogs.json" };
  console.log(`   ✓ ${auditLogs.length} audit logs saved`);

  // 22. Media Files
  console.log("🖼️  Snapshotting media files...");
  const mediaFiles = await db.mediaFile.findMany();
  fs.writeFileSync(path.join(dir, "mediaFiles.json"), JSON.stringify(mediaFiles, null, 2));
  manifest.tables.mediaFiles = { count: mediaFiles.length, file: "mediaFiles.json" };
  console.log(`   ✓ ${mediaFiles.length} media files saved`);

  // Save manifest
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\n✓ Manifest saved: ${path.join(dir, "manifest.json")}`);

  // Also save .env config (JazzCash credentials)
  const envContent = fs.readFileSync("/home/z/my-project/.env", "utf-8");
  fs.writeFileSync(path.join(dir, "env-backup.txt"), envContent);
  console.log(`✓ .env backup saved`);

  console.log("\n" + "=".repeat(60));
  console.log("RESTORE POINT CREATED SUCCESSFULLY ✓");
  console.log("=".repeat(60));
  console.log(`Location: ${dir}`);
  console.log(`Tables snapshot: ${Object.keys(manifest.tables).length}`);
  console.log(`Total records: ${Object.values(manifest.tables).reduce((s: any, t: any) => s + t.count, 0)}`);
  console.log("\nTo restore: run scripts-restore-from-point.ts with the restore point ID");
}

snapshot().catch(e => { console.error(e); process.exit(1); }).finally(() => process.exit(0));
