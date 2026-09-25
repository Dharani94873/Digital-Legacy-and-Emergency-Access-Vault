import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load .env or .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in environment variables.');
  process.exit(1);
}

async function cleanSlate() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI!);
  console.log('Connected.');

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection is not ready.');
  }

  const collections = await db.listCollections().toArray();
  console.log(`Found ${collections.length} collections.`);

  for (const col of collections) {
    const res = await db.collection(col.name).deleteMany({});
    console.log(`- Dropped ${res.deletedCount} documents from collection: ${col.name}`);
  }

  console.log('\nAll accounts and vault files have been wiped successfully.');
  console.log('You can now start from fresh login and register clean user accounts.');

  await mongoose.disconnect();
}

cleanSlate().catch((err) => {
  console.error('Error wiping database:', err);
  process.exit(1);
});
