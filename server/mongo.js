import {config} from 'dotenv';
import {fileURLToPath} from 'node:url';
import {MongoClient, ServerApiVersion} from 'mongodb';

// Load server/.env even if PM2 starts from another directory.
config({path: fileURLToPath(new URL('.env', import.meta.url)), quiet: true});

export async function connectMongo() {
  // Support the environment variable used in the earlier class lab too.
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    throw new Error('Set MONGODB_URI (or MONGO_URI) in server/.env or your host environment.');
  }
  let client;
  try {
    client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    serverSelectionTimeoutMS: 10000,
    });
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'hotel');
    await db.command({ping: 1});
    return {client, db, collection: db.collection('students')};
  } catch {
    await client?.close();
    throw new Error('MongoDB connection failed. Check the URI, database user, and Atlas network access.');
  }
}
