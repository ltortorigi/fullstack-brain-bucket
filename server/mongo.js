import express from 'express'
const app = express();
import 'dotenv/config';

import {
  MongoClient,
  ServerApiVersion
} from 'mongodb';

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
});

async function connectMongo() {
  await client.connect();

  await client
    .db('admin')
    .command({ ping: 1 });

  console.log('🏓 pinged MongoDB. connected!');
}

connectMongo();
connectMongo();
app.get(
  '/api/hello', function(req, res) {

    res.send(
      'hello from the server'
    );

  }
);

app.listen(5500, () => {
  console.log('Server is running on http://localhost:5500')
})