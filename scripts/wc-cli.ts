#!/usr/bin/env bun
/**
 * PlayBeat Digital — WooCommerce CLI
 * 
 * Usage:
 *   bunx tsx scripts/wc-cli.ts products                    # List all products
 *   bunx tsx scripts/wc-cli.ts products --search netflix   # Search products
 *   bunx tsx scripts/wc-cli.ts orders                      # List orders
 *   bunx tsx scripts/wc-cli.ts categories                  # List categories
 *   bunx tsx scripts/wc-cli.ts status                     # Store status
 *   bunx tsx scripts/wc-cli.ts create --name "Test" --price 499  # Create product
 *   bunx tsx scripts/wc-cli.ts delete <id>                 # Delete product
 *   bunx tsx scripts/wc-cli.ts reset                       # Reset all analytics
 *   bunx tsx scripts/wc-cli.ts wp-json                     # API discovery
 */

const BASE_URL = "http://localhost:3000";

async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  return res.json();
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(`
PlayBeat Digital — WooCommerce CLI

Commands:
  products [--search <query>]     List products (optional search)
  orders                          List orders
  categories                      List categories
  status                          Store system status
  create --name <name> --price <price>  Create a product
  delete <id>                     Delete a product
  reset                           Reset all analytics data
  wp-json                         Show API discovery info

Examples:
  bunx tsx scripts/wc-cli.ts products
  bunx tsx scripts/wc-cli.ts products --search netflix
  bunx tsx scripts/wc-cli.ts create --name "New Product" --price 999
`);
    return;
  }

  switch (command) {
    case "products": {
      const searchArg = args.indexOf("--search");
      const search = searchArg >= 0 ? args[searchArg + 1] : "";
      const url = search
        ? `/api/v1/products?search=${encodeURIComponent(search)}&limit=100`
        : `/api/v1/products?limit=100`;
      const d = await api(url);
      const items = d.data?.items || [];
      console.log(`\nProducts (${items.length}):`);
      items.forEach((p: any) => {
        console.log(`  ${p.id.substring(0, 12)}  Rs ${String(p.price).padStart(6)}  ${p.title}`);
      });
      break;
    }
    case "orders": {
      const d = await api("/api/v1/admin/orders?limit=50");
      const items = d.data?.items || [];
      console.log(`\nOrders (${items.length}):`);
      items.forEach((o: any) => {
        console.log(`  ${o.orderNumber}  Rs ${o.total}  ${o.status}  ${o.customerName}`);
      });
      break;
    }
    case "categories": {
      const d = await api("/api/v1/categories");
      const items = d.data?.items || [];
      console.log(`\nCategories (${items.length}):`);
      items.forEach((c: any) => {
        console.log(`  ${c.slug.padEnd(20)} ${c.name}`);
      });
      break;
    }
    case "status": {
      const d = await api("/wp-json/wc/v3/system_status");
      console.log(`\nStore Status:`);
      console.log(`  WooCommerce: 8.6.1`);
      console.log(`  WordPress: 6.5.2`);
      console.log(`  Theme: PlayBeat Digital`);
      console.log(`  Currency: PKR`);
      break;
    }
    case "create": {
      const nameArg = args.indexOf("--name");
      const priceArg = args.indexOf("--price");
      const name = nameArg >= 0 ? args[nameArg + 1] : "Untitled";
      const price = priceArg >= 0 ? Number(args[priceArg + 1]) : 0;
      const d = await api("/api/v1/admin/products/create", {
        method: "POST",
        body: JSON.stringify({ title: name, type: "DIGITAL_DOWNLOAD", price, currency: "PKR", status: "PUBLISHED" }),
      });
      if (d.success) console.log(`Created: ${d.data.product.title} — Rs ${d.data.product.price}`);
      else console.log(`Failed: ${d.error?.message}`);
      break;
    }
    case "delete": {
      const id = args[1];
      if (!id) { console.log("Usage: delete <id>"); break; }
      const d = await api("/api/v1/admin/products/delete", {
        method: "POST",
        body: JSON.stringify({ id }),
      });
      if (d.success) console.log(`Deleted: ${d.data.title}`);
      else console.log(`Failed: ${d.error?.message}`);
      break;
    }
    case "reset": {
      const d = await api("/api/v1/admin/analytics/reset", { method: "POST" });
      if (d.success) console.log(`Reset: ${d.data.cleared.orders} orders, ${d.data.cleared.payments} payments cleared`);
      else console.log(`Reset failed`);
      break;
    }
    case "wp-json": {
      const d = await api("/wp-json");
      console.log(`\nAPI Discovery:`);
      console.log(`  Name: ${d.name}`);
      console.log(`  URL: ${d.url}`);
      console.log(`  Namespaces: ${d.namespaces?.join(", ")}`);
      break;
    }
    default:
      console.log(`Unknown command: ${command}`);
  }
}

main().catch(console.error);
