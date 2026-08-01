// Database connection function
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseConn: { isConnected?: number } | undefined;
}

const cached = global.mongooseConn ?? (global.mongooseConn = {});

async function dbConnect(): Promise<void> {
  if (cached.isConnected) {
    console.log("Already connected to database");
    return;
  }

  try {
    const db = await mongoose.connect(MONGODB_URI as string);
    cached.isConnected = db.connections[0].readyState;
    console.log("Database connection successful");
  } catch (error) {
    console.log("DB connection failed");
    console.log(`ERROR: ${error}`);
    throw new Error("Database connection failed");
  }
}

export default dbConnect;