import { MongoClient } from "mongodb";

const uri = "mongodb+srv://max11:NciH9bevWbkDz5IT@playbeat.umqpdyx.mongodb.net/playbeat?retryWrites=true&w=majority&appName=playbeat";

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("playbeat");
  
  try {
    await db.collection("Transaction").dropIndex("Transaction_transactionId_key");
    console.log("✓ Dropped Transaction_transactionId_key index");
  } catch (e) {
    console.log("Index drop error:", e instanceof Error ? e.message : e);
  }
  
  const result = await db.collection("Transaction").updateMany(
    { transactionId: null },
    { $set: { transactionId: "" } }
  );
  console.log(`✓ Updated ${result.modifiedCount} null transactionId values`);
  
  await client.close();
}
main().catch(console.error).finally(() => process.exit(0));
