import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mongoConnectionMessage, validateMongoUri} from '../mongo-errors.js';

test('connection diagnostics identify authentication without echoing credentials', () => {
  const secret = 'mongodb+srv://private-user:private-password@example.mongodb.net';
  const message = mongoConnectionMessage({code: 18, message: secret});
  assert.match(message, /^\[MONGO_AUTH\]/);
  assert.ok(!message.includes('private-user'));
  assert.ok(!message.includes('private-password'));
  assert.match(mongoConnectionMessage({code: 8000, message: 'bad auth'}), /^\[MONGO_AUTH\]/);
  assert.match(mongoConnectionMessage({message: secret}), /^\[MONGO_CONNECTION\]/);
});

test('nested server selection errors preserve DNS and TLS diagnoses', () => {
  const error = {name: 'MongoServerSelectionError', reason: {servers: new Map([
    ['private-host', {error: {cause: {code: 'ENOTFOUND'}}}],
  ])}};
  assert.match(mongoConnectionMessage(error), /^\[MONGO_DNS\]/);
  error.reason.servers.set('private-host', {error: {cause: {code: 'CERT_HAS_EXPIRED'}}});
  assert.match(mongoConnectionMessage(error), /^\[MONGO_TLS\]/);
  error.reason.servers.clear();
  assert.match(mongoConnectionMessage(error), /^\[MONGO_NETWORK\]/);
});

test('format and permission errors receive actionable fixed messages', () => {
  assert.match(mongoConnectionMessage({name: 'MongoParseError'}), /^\[MONGO_URI\]/);
  assert.match(mongoConnectionMessage({code: 13}), /^\[MONGO_PERMISSION\]/);
  const cycle = {name: 'MongoNetworkError'};
  cycle.cause = cycle;
  assert.match(mongoConnectionMessage(cycle), /^\[MONGO_NETWORK\]/);
});

test('example placeholders are rejected without printing URI values', () => {
  for (const uri of [
    'mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/',
    'mongodb+srv://someone:<db_password>@cluster.mongodb.net/',
  ]) {
    assert.throws(() => validateMongoUri(uri, 'MONGODB_URI'), (error) => {
      assert.match(error.message, /^\[MONGO_PLACEHOLDER\]/);
      assert.ok(!error.message.includes(uri));
      return true;
    });
  }
  assert.doesNotThrow(() => validateMongoUri('mongodb+srv://user:encoded%40password@cluster.mongodb.net/', 'MONGO_URI'));
});
