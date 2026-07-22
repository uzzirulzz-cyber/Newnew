import { db } from "@/lib/db";
async function main() {
  const result = await db.webhook.updateMany({
    where: {},
    data: { updatedAt: new Date() },
  });
  console.log("Updated webhooks:", result.count);
}
main().catch(console.error).finally(() => process.exit(0));
