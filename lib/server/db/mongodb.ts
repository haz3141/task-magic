import { MongoClient, Db } from "mongodb";

// Global cache for MongoClient (important for dev hot reload / serverless)
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }

    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB || "whiteboard";

    if (!uri) {
        throw new Error("Please define the MONGODB_URI environment variable");
    }

    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);

    cachedClient = client;
    cachedDb = db;

    return { client, db };
}
