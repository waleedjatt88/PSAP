import mongoose from "mongoose";

let cachedConnection = null;

/**
 * Connects to MongoDB using a cached connection reference.
 * Prevents multiple connections during local HMR/reload and serverless requests.
 */
export async function connectToDatabase() {
  if (cachedConnection) {
    return cachedConnection;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not defined. Please set it in your environment variables/file."
    );
  }

  // Check current mongoose connection state before opening a new one
  if (mongoose.connection.readyState === 0) {
    cachedConnection = await mongoose.connect(uri);
    console.log("✔ MongoDB Connected  successfully.");
  } else {
    cachedConnection = mongoose.connection;
  }

  return cachedConnection;
}

/**
 * Returns a string representing the connection state.
 */
export function getConnectionState() {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return states[mongoose.connection.readyState] || "unknown";
}
