import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Global cache to reuse the Mongoose connection across hot-reloads in dev.
 * Without this, every file change would open a new connection.
 *
 * @see https://mongoosejs.com/docs/connections.html
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

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

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
      })
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
