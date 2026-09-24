import 'dotenv/config';
import { MongoClient, ServerApiVersion } from 'mongodb';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

const uri = process.env.MONGO_URI;

// Middleware
app.use(express.static(join(__dirname, '../public')));
app.use(express.json());


// MongoDB Client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// Connect to MongoDB
async function run() {

  try {

    await client.connect();

    await client
      .db('admin')
      .command({ ping: 1 });

    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );

  } catch (error) {

    console.error(error);

  }

}

run();


// Home Page
app.get('/', (req, res) => {

  res.sendFile(
    join(__dirname, '../public', 'hotel.html')
  );

});


// Hello Route
app.get('/api/hello', function(req, res) {

  const message = {
    message: 'hello from hard code json',
    success: 'true'
  };

  res.json(message);

});


// POST Student
app.post('/api/students', async function(req, res) {

  try {

    console.log(req.body);

    const database =
      client.db('hotel');

    const students =
      database.collection('students');

    const result =
      await students.insertOne(req.body);

    res.json({
      success: true,
      insertedId: result.insertedId,
      received: req.body
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });

  }

});


// GET Students
app.get('/api/students', async function(req, res) {

  try {

    const database =
      client.db('hotel');

    const students =
      database.collection('students');

    const data =
      await students
        .find({})
        .toArray();

    res.json(data);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });

  }

});


// Start Server
app.listen(5500, () => {

  console.log(
    'Server is running on http://localhost:5500'
  );

});