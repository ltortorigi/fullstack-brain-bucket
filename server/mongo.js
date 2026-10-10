import {config} from 'dotenv';
import {fileURLToPath} from 'node:url';
import {MongoClient, ServerApiVersion} from 'mongodb';
import {mongoConnectionMessage, validateMongoUri} from './mongo-errors.js';

// Load server/.env even if PM2 starts from another directory.
config({path: fileURLToPath(new URL('.env', import.meta.url)), quiet: true});

export async function connectMongo() {
  // Support the environment variable used in the earlier class lab too.
  const source = process.env.MONGODB_URI ? 'MONGODB_URI' : 'MONGO_URI';
  const uri = process.env[source];
  if (!uri) {
    throw new Error('Set MONGODB_URI (or MONGO_URI) in server/.env or your host environment.');
  }
  validateMongoUri(uri, source);
  console.log(`Connecting to MongoDB using ${source}.`);
  if (process.env.MONGODB_URI && process.env.MONGO_URI) {
    console.log('Both URI variables are set; MONGODB_URI takes precedence.');
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
  } catch (error) {
    // A cleanup failure must not hide the original connection diagnosis.
    await client?.close().catch(() => {});
    throw new Error(mongoConnectionMessage(error));
  }
}
