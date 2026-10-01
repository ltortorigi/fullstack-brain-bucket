import express from 'express';
import {ObjectId} from 'mongodb';
import {fileURLToPath} from 'node:url';

const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
const limits = {name: 100, major: 80, notes: 500};
const seedData = [
  {name: 'Alex Example', major: 'CIS', notes: 'Sample record for the HOTEL demo.'},
  {name: 'Jordan Example', major: 'Exercise Science', notes: 'Try filtering by this major.'},
  {name: 'Taylor Example', major: 'CIS', notes: 'Try editing or deleting this sample.'},
];

function validateStudent(body, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw Object.assign(new Error('Send a JSON object.'), {status: 400});
  }
  const keys = Object.keys(body);
  if (!keys.length || keys.some((key) => !Object.hasOwn(limits, key))) {
    throw Object.assign(new Error('Use only name, major, and notes fields.'), {status: 400});
  }
  const student = {};
  for (const [field, max] of Object.entries(limits)) {
    if (partial && !Object.hasOwn(body, field)) continue;
    const value = body[field] ?? (field === 'notes' ? '' : undefined);
    if (typeof value !== 'string' || value.trim().length > max ||
        (field !== 'notes' && !value.trim())) {
      throw Object.assign(new Error(`${field} must be text, ${field === 'notes' ? '0' : '1'}–${max} characters.`), {status: 400});
    }
    student[field] = value.trim();
  }
  return student;
}

export function createApp({collection, ping = async () => {}, devTools = false}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({limit: '16kb'}));
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.get('/api/hello', (req, res) => {
    res.json({message: 'Hello from HOTEL!', success: true});
  });
  app.get('/api/health', async (req, res) => {
    try {
      await ping();
      res.json({status: 'ok', database: 'connected', devTools});
    } catch {
      res.status(503).json({error: 'Database unavailable. Please try again shortly.'});
    }
  });

  // req.query selects a major; no query means all students.
  app.get('/api/students', async (req, res) => {
    const major = req.query.major;
    if (major !== undefined && (typeof major !== 'string' || major.length > 80)) {
      return res.status(400).json({error: 'major must be one text value, up to 80 characters.'});
    }
    const filter = major?.trim() ? {major: major.trim()} : {};
    const students = await collection.find(filter).sort({name: 1, _id: 1}).toArray();
    res.json(students);
  });

  // req.params.id arrives as a string; MongoDB needs an ObjectId.
  app.param('id', (req, res, next, value) => {
    if (!/^[a-f\d]{24}$/i.test(value)) {
      return res.status(400).json({error: 'Student ID must be a 24-character MongoDB ObjectId.'});
    }
    req.studentId = new ObjectId(value);
    next();
  });
  app.get('/api/students/:id', async (req, res) => {
    const student = await collection.findOne({_id: req.studentId});
    if (!student) return res.status(404).json({error: 'Student not found.'});
    res.json(student);
  });

  // req.body contains the JSON sent by the frontend form.
  app.post('/api/students', async (req, res) => {
    const student = validateStudent(req.body);
    student.createdAt = new Date();
    student.updatedAt = student.createdAt;
    const result = await collection.insertOne(student);
    res.location(`/api/students/${result.insertedId}`).status(201)
        .json({...student, _id: result.insertedId});
  });
  app.patch('/api/students/:id', async (req, res) => {
    const changes = {...validateStudent(req.body, true), updatedAt: new Date()};
    const result = await collection.updateOne({_id: req.studentId}, {$set: changes});
    if (!result.matchedCount) return res.status(404).json({error: 'Student not found.'});
    res.json(await collection.findOne({_id: req.studentId}));
  });
  app.delete('/api/students/:id', async (req, res) => {
    const result = await collection.deleteOne({_id: req.studentId});
    if (!result.deletedCount) return res.status(404).json({error: 'Student not found.'});
    res.json({deletedId: req.params.id, deletedCount: result.deletedCount});
  });

  // Opt in locally. These controls never clear ordinary student records.
  if (devTools) {
    app.post('/api/dev/seed', async (req, res) => {
      let insertedCount = 0;
      for (const student of seedData) {
        const result = await collection.updateOne(
            {demoKey: student.name, demoRecord: true},
            {$setOnInsert: {...student, createdAt: new Date(), updatedAt: new Date()}},
            {upsert: true});
        insertedCount += result.upsertedCount;
      }
      res.json({insertedCount});
    });
    app.delete('/api/dev/clear', async (req, res) => {
      const result = await collection.deleteMany({demoRecord: true});
      res.json({deletedCount: result.deletedCount});
    });
  }
  app.use('/api', (req, res) => res.status(404).json({error: 'API route not found.'}));
  app.get(['/', '/index.html'], (req, res) => res.sendFile(`${publicDir}hotel.html`));
  app.use(express.static(publicDir));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({error: 'Request body must be valid JSON.'});
    }
    if (error.type === 'entity.too.large') {
      return res.status(413).json({error: 'Request body is too large.'});
    }
    if (error.status === 400) return res.status(400).json({error: error.message});
    console.error('Student database operation failed.');
    res.status(503).json({error: 'Database request failed. Please try again shortly.'});
  });
  return app;
}
