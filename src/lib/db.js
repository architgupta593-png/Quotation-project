import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Global cache to reuse the Mongoose connection across hot-reloads in dev
 * and across serverless function invocations in production.
 *
 * @see https://mongoosejs.com/docs/connections.html
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Mongoose connection options optimised for shared hosting (Hostinger).
 *
 * Key settings:
 *  - Reduced pool size (5 instead of default 100) to stay within shared hosting limits
 *  - Short timeouts to fail fast instead of hanging (prevents 504 Gateway Timeout)
 *  - Heartbeat keeps the connection alive on idle shared servers
 */
const MONGOOSE_OPTIONS = {
  bufferCommands: false,
  maxPoolSize: 5,                   // Low pool for shared hosting
  minPoolSize: 1,                   // Keep at least 1 connection alive
  connectTimeoutMS: 10_000,         // 10s to establish connection
  socketTimeoutMS: 45_000,          // 45s for query execution
  serverSelectionTimeoutMS: 10_000, // 10s to find a server
  heartbeatFrequencyMS: 30_000,     // Ping every 30s to keep alive
};

/**
 * Connect to MongoDB using a singleton pattern.
 * Call this at the top of any Server Component or Route Handler that needs the DB.
 *
 * @returns {Promise<typeof mongoose>}
 */
export async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error(
      "Please define the MONGODB_URI environment variable in .env.local"
    );
  }

  // If we have a live connection, return it
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If the connection dropped, reset the cache so we reconnect
  if (cached.conn && mongoose.connection.readyState !== 1) {
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, MONGOOSE_OPTIONS)
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
