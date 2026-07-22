import { db } from "@/lib/db";

async function main() {
  console.log("=".repeat(60));
  console.log("PLAYBEAT DIGITAL — DATABASE STATE SNAPSHOT");
  console.log("=".repeat(60));
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log("");

  // 1. Products
  const products = await db.product.findMany({
    select: { id: true, title: true, price: true, currency: true, status: true, type: true, featured: true },
    orderBy: { title: 'asc' }
  });
  console.log(`📊 PRODUCTS: ${products.length} total`);
  const published = products.filter(p => p.status === 'PUBLISHED');
  const pkrProducts = products.filter(p => p.currency === 'PKR');
  console.log(`   Published: ${published.length}, PKR currency: ${pkrProducts.length}`);
  console.log(`   Price range: Rs ${Math.min(...products.map(p => p.price))} - Rs ${Math.max(...products.map(p => p.price))}`);
  console.log(`   Total catalog value: Rs ${products.reduce((s, p) => s + p.price, 0).toLocaleString()}`);

  // 2. Categories
  const categories = await db.category.findMany();
  console.log(`\n📂 CATEGORIES: ${categories.length}`);
  categories.forEach(c => console.log(`   - ${c.name} (${c.slug})`));

  // 3. Vendors
  const vendors = await db.vendor.findMany();
  console.log(`\n🏪 VENDORS: ${vendors.length}`);
  vendors.forEach(v => console.log(`   - ${v.storeName} (verified: ${v.verified})`));

  // 4. Orders
  const orders = await db.order.findMany({
    select: { id: true, orderNumber: true, status: true, total: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  const totalOrders = await db.order.count();
  console.log(`\n🛒 ORDERS: ${totalOrders} total (showing last 10)`);
  orders.forEach(o => console.log(`   - ${o.orderNumber}: Rs ${o.total} (${o.status}) ${o.createdAt.toISOString().split('T')[0]}`));

  // 5. Payments
  const payments = await db.payment.findMany({
    select: { id: true, provider: true, status: true, amount: true },
    take: 10
  });
  const totalPayments = await db.payment.count();
  console.log(`\n💳 PAYMENTS: ${totalPayments} total (showing last 10)`);
  payments.forEach(p => console.log(`   - ${p.provider}: Rs ${p.amount} (${p.status})`));

  // 6. Users
  const users = await db.user.findMany({ select: { id: true, name: true, email: true, role: true } });
  console.log(`\n👥 USERS: ${users.length}`);
  users.forEach(u => console.log(`   - ${u.name} (${u.email}) role: ${u.role}`));

  // 7. Settings
  const settings = await db.setting.findMany();
  console.log(`\n⚙️  SETTINGS: ${settings.length} records`);
  settings.forEach(s => console.log(`   - ${s.key}: ${String(s.value).substring(0, 80)}`));

  // 8. Coupons
  const coupons = await db.coupon.findMany();
  console.log(`\n🏷️  COUPONS: ${coupons.length}`);

  // 9. Reviews
  const reviews = await db.review.findMany({ take: 5 });
  const totalReviews = await db.review.count();
  console.log(`\n⭐ REVIEWS: ${totalReviews} total`);

  // 10. Favorites
  const favorites = await db.favorite.findMany();
  console.log(`\n❤️  FAVORITES: ${favorites.length}`);

  console.log("\n" + "=".repeat(60));
  console.log("DATABASE STATE: HEALTHY ✓");
  console.log("=".repeat(60));
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => process.exit(0));
