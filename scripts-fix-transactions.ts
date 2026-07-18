import { MongoClient } from "mongodb";

const uri = "mongodb+srv://max11:NciH9bevWbkDz5IT@playbeat.umqpdyx.mongodb.net/playbeat?retryWrites=true&w=majority&appName=playbeat";

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("playbeat");
  
  // Find and delete transactions with malformed IDs
  const transactions = await db.collection("Transaction").find({}).toArray();
  console.log(`Found ${transactions.length} transactions`);
  
  let deleted = 0;
  for (const t of transactions) {
    const id = t._id?.toString() || "";
    // Valid ObjectId is 24 hex chars
    if (id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(id)) {
      console.log(`  Malformed ID: ${id} (length ${id.length}) — deleting`);
      await db.collection("Transaction").deleteOne({ _id: t._id });
      deleted++;
    }
  }
  
  console.log(`\n✓ Deleted ${deleted} malformed transactions`);
  
  // Also check Notifications
  const notifications = await db.collection("Notification").find({}).toArray();
  let badNotifs = 0;
  for (const n of notifications) {
    const id = n._id?.toString() || "";
    if (id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(id)) {
      await db.collection("Notification").deleteOne({ _id: n._id });
      badNotifs++;
    }
  }
  console.log(`✓ Deleted ${badNotifs} malformed notifications`);
  
  await client.close();
}
main().catch(console.error).finally(() => process.exit(0));
