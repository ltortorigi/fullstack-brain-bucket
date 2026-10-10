// Return fixed guidance only. Driver messages can contain connection details.
export function mongoConnectionMessage(error) {
  const errors = [];
  const pending = [error];
  const seen = new Set();
  while (pending.length && errors.length < 30) {
    const current = pending.shift();
    if (!current || typeof current !== 'object' || seen.has(current)) continue;
    seen.add(current);
    errors.push(current);
    pending.push(current.cause, current.reason, current.error);
    if (current.servers instanceof Map) pending.push(...current.servers.values());
  }
  const has = (predicate) => errors.some(predicate);
  if (has((item) => item.code === 18 || item.codeName === 'AuthenticationFailed' ||
      (item.code === 8000 && /auth|credential/i.test(item.message || '')))) {
    return '[MONGO_AUTH] MongoDB rejected the database username or password. Use the Atlas database user credentials and URL-encode special password characters.';
  }
  if (has((item) => item.code === 13 || item.codeName === 'Unauthorized')) {
    return '[MONGO_PERMISSION] The database user lacks access. Check its permissions for the database selected by MONGODB_DB.';
  }
  if (has((item) => ['MongoParseError', 'MongoInvalidArgumentError', 'TypeError'].includes(item.name))) {
    return '[MONGO_URI] The connection string format is invalid. Paste only the complete mongodb+srv:// or mongodb:// URI, without the variable name or surrounding quotes. URL-encode special password characters.';
  }
  if (has((item) => ['ENOTFOUND', 'EAI_AGAIN', 'ESERVFAIL', 'EREFUSED'].includes(item.code))) {
    return '[MONGO_DNS] The MongoDB cluster address could not be resolved. Check the hostname copied from Atlas and make sure the cluster is active.';
  }
  if (has((item) => typeof item.code === 'string' &&
      /^(ERR_SSL_|CERT_|UNABLE_TO_VERIFY_LEAF_SIGNATURE$|DEPTH_ZERO_SELF_SIGNED_CERT$)/.test(item.code))) {
    return '[MONGO_TLS] MongoDB TLS verification failed. Check the host certificate setup and network; keep certificate verification enabled.';
  }
  if (has((item) => ['MongoServerSelectionError', 'MongoNetworkError', 'MongoNetworkTimeoutError'].includes(item.name) ||
      ['ETIMEDOUT', 'ECONNREFUSED', 'ECONNRESET', 'ENETUNREACH', 'EHOSTUNREACH'].includes(item.code))) {
    return '[MONGO_NETWORK] No MongoDB server was reachable. Check Atlas Network Access for this host, cluster availability, and its network connection. On Render, find the required IP ranges under Connect > Outbound.';
  }
  return '[MONGO_CONNECTION] MongoDB could not connect. Check the URI, database user, cluster availability, and Atlas Network Access.';
}

export function validateMongoUri(uri, source) {
  if (/<[^>]*>|YOUR_(?:USER|PASSWORD|CLUSTER)/i.test(uri)) {
    throw new Error(`[MONGO_PLACEHOLDER] ${source} still contains an example value or placeholder. Replace it with your complete Atlas URI. MONGODB_URI takes precedence when both URI variables are set.`);
  }
}
