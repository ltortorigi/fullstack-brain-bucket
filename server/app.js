import {connectMongo} from './mongo.js';
import {createApp} from './routes.js';

async function start() {
  const {client, db, collection} = await connectMongo();
  const app = createApp({
    collection,
    ping: () => db.command({ping: 1}),
    devTools: process.env.NODE_ENV !== 'production' &&
      process.env.ENABLE_DEV_TOOLS === 'true',
  });
  const port = Number(process.env.PORT || 3000);
  const server = app.listen(port, () => {
    console.log(`HOTEL connected to MongoDB. Server listening on port ${port}.`);
  });
  server.on('error', async () => {
    console.error('Could not start HTTP server. Check PORT and running processes.');
    await client.close();
    process.exitCode = 1;
  });
  const shutdown = () => {
    server.close(async () => {
      await client.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}

start().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
