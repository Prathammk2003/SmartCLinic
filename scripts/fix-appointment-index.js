// Script to fix the appointment index issue
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

async function fixAppointmentIndex() {
  console.log('Connecting to MongoDB...');
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Drop the problematic index
    console.log('Dropping the problematic doctorId_1_date_1_startTime_1 index...');
    try {
      await mongoose.connection.db.collection('appointments').dropIndex('doctorId_1_date_1_startTime_1');
      console.log('Index dropped successfully');
    } catch (indexError) {
      console.log('Error dropping index:', indexError.message);
      console.log('This might be OK if the index does not exist or has already been dropped');
    }

    // Create the correct index
    console.log('Ensuring the correct doctorId_1_slotId_1 index exists...');
    await mongoose.connection.db.collection('appointments').createIndex(
      { doctorId: 1, slotId: 1 },
      { unique: true }
    );
    console.log('New index created successfully');

    console.log('\nIndex fix completed. Now restart your application.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
fixAppointmentIndex(); 