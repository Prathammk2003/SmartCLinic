// CommonJS script to fix the appointment index problem
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not set!');
  console.log('Make sure your .env.local file has the MONGO_URI variable defined.');
  process.exit(1);
}

console.log('MONGODB_URI found:', MONGODB_URI.substring(0, 20) + '...');

async function fixIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get the appointments collection
    const db = mongoose.connection.db;
    const collection = db.collection('appointments');
    
    // Get existing indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(idx => idx.name));
    
    // Drop the problematic index if it exists
    try {
      await collection.dropIndex('doctorId_1_date_1_startTime_1');
      console.log('Successfully dropped the problematic index');
    } catch (error) {
      console.log('Could not drop index (it may not exist):', error.message);
    }
    
    // Create the correct index
    await collection.createIndex(
      { doctorId: 1, slotId: 1 },
      { unique: true, name: 'doctorId_1_slotId_1' }
    );
    console.log('Successfully created doctorId_1_slotId_1 index');
    
    // Verify final indexes
    const finalIndexes = await collection.indexes();
    console.log('Final indexes:', finalIndexes.map(idx => idx.name));
    
    console.log('Index fix completed successfully!');
  } catch (error) {
    console.error('Error fixing index:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

fixIndex(); 