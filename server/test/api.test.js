import {after, before, beforeEach, test} from 'node:test';
import assert from 'node:assert/strict';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {MongoClient, ObjectId} from 'mongodb';
import {createApp} from '../routes.js';

let mongo;
let client;
let collection;
let server;
let base;

before(async () => {
  // A real, disposable local MongoDB process; never use an Atlas database here.
  mongo = await MongoMemoryServer.create();
  client = new MongoClient(mongo.getUri());
  await client.connect();
  const db = client.db('hotel_test');
  collection = db.collection('students');
  server = createApp({collection, ping: () => db.command({ping: 1}), devTools: true})
      .listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
beforeEach(async () => collection.deleteMany({}));
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (client) await client.close();
  if (mongo) await mongo.stop();
});

async function api(path, method = 'GET', body) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {'Content-Type': 'application/json'},
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {status: response.status, headers: response.headers, data: await response.json()};
}

async function create(name = 'Alex Example', major = 'CIS') {
  return api('/api/students', 'POST', {name, major, notes: 'A test record.'});
}

test('home and static frontend assets load from the same server', async () => {
  for (const path of ['/', '/index.html', '/hotel.html', '/assets/js/hotel.js', '/assets/css/hotel.css']) {
    const response = await fetch(`${base}${path}`);
    assert.equal(response.status, 200, path);
  }
});

test('health checks a real MongoDB connection and hello returns JSON', async () => {
  assert.equal((await api('/api/health')).data.database, 'connected');
  assert.equal((await api('/api/hello')).data.success, true);
});

test('complete CRUD persists across new MongoDB client connections', async () => {
  const created = await create('  Alex Example  ');
  assert.equal(created.status, 201);
  assert.equal(created.data.name, 'Alex Example');
  const path = `/api/students/${created.data._id}`;
  assert.equal(created.headers.get('location'), path);
  assert.equal((await api('/api/students')).data.length, 1);
  assert.equal((await api(path)).data.major, 'CIS');
  assert.equal((await api(path, 'PATCH', {major: 'Business'})).data.major, 'Business');
  const independentClient = new MongoClient(mongo.getUri());
  try {
    await independentClient.connect();
    const stored = await independentClient.db('hotel_test').collection('students')
        .findOne({_id: new ObjectId(created.data._id)});
    assert.equal(stored.major, 'Business');
    assert.equal(stored.name, 'Alex Example');
    assert.ok(stored.createdAt instanceof Date);
  } finally {
    await independentClient.close();
  }
  assert.equal((await api(path, 'DELETE')).data.deletedCount, 1);
  assert.equal((await api(path)).status, 404);
  assert.deepEqual((await api('/api/students')).data, []);
});

test('major query filters the database and supports encoded characters', async () => {
  await create('Alex', 'CIS');
  await create('Jordan', 'Arts & Sciences');
  const filtered = await api('/api/students?major=Arts%20%26%20Sciences');
  assert.equal(filtered.data.length, 1);
  assert.equal(filtered.data[0].name, 'Jordan');
  assert.deepEqual((await api('/api/students?major=Unknown')).data, []);
  assert.equal((await api('/api/students?major=CIS&major=Business')).status, 400);
});

test('invalid identifiers and missing records produce helpful JSON errors', async () => {
  for (const method of ['GET', 'PATCH', 'DELETE']) {
    const body = method === 'PATCH' ? {name: 'Update'} : undefined;
    assert.equal((await api('/api/students/not-an-id', method, body)).status, 400);
    assert.equal((await api(`/api/students/${new ObjectId()}`, method, body)).status, 404);
  }
});

test('validation rejects blanks, oversized text, operators and protected fields', async () => {
  const invalid = [{}, [], {name: '', major: 'CIS'}, {name: 'x', major: 2},
    {name: 'x'.repeat(101), major: 'CIS'}, {name: 'x', major: 'CIS', $set: {}},
    {name: 'x', major: 'CIS', _id: 'anything'}, {name: 'x', major: {ne: ''}}];
  for (const body of invalid) {
    assert.equal((await api('/api/students', 'POST', body)).status, 400);
  }
  const created = await create();
  assert.equal((await api(`/api/students/${created.data._id}`, 'PATCH', {})).status, 400);
  assert.equal((await api(`/api/students/${created.data._id}`, 'PATCH', {createdAt: 'fake'})).status, 400);
  assert.equal((await collection.countDocuments({})), 1);
});

test('invalid JSON and large payloads get JSON errors', async () => {
  const bad = await fetch(`${base}/api/students`, {method: 'POST',
    headers: {'Content-Type': 'application/json'}, body: '{broken'});
  assert.equal(bad.status, 400);
  assert.equal((await bad.json()).error, 'Request body must be valid JSON.');
  assert.equal((await api('/api/students', 'POST', {notes: 'x'.repeat(20000)})).status, 413);
});

test('sample seeding is repeatable and clearing preserves ordinary records', async () => {
  const ordinary = await create('Keep this student');
  assert.equal((await api('/api/dev/seed', 'POST')).data.insertedCount, 3);
  assert.equal((await api('/api/dev/seed', 'POST')).data.insertedCount, 0);
  assert.equal((await api('/api/dev/clear', 'DELETE')).data.deletedCount, 3);
  assert.equal((await api(`/api/students/${ordinary.data._id}`)).status, 200);
});

test('sample data tools are disabled by default', async () => {
  const locked = createApp({collection}).listen(0, '127.0.0.1');
  await new Promise((resolve) => locked.once('listening', resolve));
  try {
    const origin = `http://127.0.0.1:${locked.address().port}`;
    assert.equal((await fetch(`${origin}/api/dev/clear`, {method: 'DELETE'})).status, 404);
    assert.equal((await fetch(`${origin}/api/dev/seed`, {method: 'POST'})).status, 404);
  } finally {
    await new Promise((resolve) => locked.close(resolve));
  }
});

test('unknown API routes return JSON instead of the HTML app', async () => {
  const result = await api('/api/missing');
  assert.equal(result.status, 404);
  assert.equal(result.data.error, 'API route not found.');
});
