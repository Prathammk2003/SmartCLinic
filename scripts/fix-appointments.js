// Script to fix appointments with null slotId values
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not set!');
  console.log('Make sure your .env.local file has the MONGO_URI variable defined.');
  process.exit(1);
}

console.log('MONGODB_URI found:', MONGODB_URI.substring(0, 20) + '...');

async function fixAppointments() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get the appointments collection
    const db = mongoose.connection.db;
    const appointmentsCollection = db.collection('appointments');
    
    // First, find all appointments with null slotId
    const invalidAppointments = await appointmentsCollection.find({ 
      $or: [
        { slotId: null },
        { slotId: { $exists: false } }
      ]
    }).toArray();
    
    console.log(`Found ${invalidAppointments.length} appointments with null or missing slotId`);
    
    if (invalidAppointments.length > 0) {
      // Group by doctorId to identify duplicates
      const groupedByDoctor = {};
      
      invalidAppointments.forEach(appt => {
        const doctorId = appt.doctorId ? appt.doctorId.toString() : 'unknown';
        if (!groupedByDoctor[doctorId]) {
          groupedByDoctor[doctorId] = [];
        }
        groupedByDoctor[doctorId].push(appt);
      });
      
      // Handle each group of invalid appointments
      for (const [doctorId, appointments] of Object.entries(groupedByDoctor)) {
        if (appointments.length > 1) {
          console.log(`Doctor ${doctorId} has ${appointments.length} invalid appointments - keeping only the most recent one`);
          
          // Sort by createdAt date (descending)
          appointments.sort((a, b) => {
            return (b.createdAt || 0) - (a.createdAt || 0);
          });
          
          // Keep the most recent one, delete the rest
          const keepId = appointments[0]._id;
          console.log(`Keeping appointment ${keepId} and deleting the rest`);
          
          for (let i = 1; i < appointments.length; i++) {
            await appointmentsCollection.deleteOne({ _id: appointments[i]._id });
            console.log(`Deleted appointment ${appointments[i]._id}`);
          }
        }
      }
      
      // Now, for each remaining invalid appointment, create a dummy slotId
      console.log('Creating dummy slot IDs for remaining invalid appointments...');
      const remainingInvalid = await appointmentsCollection.find({ 
        $or: [
          { slotId: null },
          { slotId: { $exists: false } }
        ]
      }).toArray();
      
      for (const appt of remainingInvalid) {
        const dummySlotId = new mongoose.Types.ObjectId();
        await appointmentsCollection.updateOne(
          { _id: appt._id },
          { $set: { slotId: dummySlotId, notes: 'Fixed by script - dummy slotId added' } }
        );
        console.log(`Updated appointment ${appt._id} with dummy slotId ${dummySlotId}`);
      }
    }
    
    // Drop the problematic index if it exists
    try {
      await appointmentsCollection.dropIndex('doctorId_1_date_1_startTime_1');
      console.log('Successfully dropped the problematic index');
    } catch (error) {
      console.log('Could not drop index (it may not exist):', error.message);
    }
    
    // Create the correct index
    await appointmentsCollection.createIndex(
      { doctorId: 1, slotId: 1 },
      { unique: true, name: 'doctorId_1_slotId_1' }
    );
    console.log('Successfully created doctorId_1_slotId_1 index');
    
    // Verify final indexes
    const finalIndexes = await appointmentsCollection.indexes();
    console.log('Final indexes:', finalIndexes.map(idx => idx.name));
    
    console.log('Appointment data fix completed successfully!');
  } catch (error) {
    console.error('Error fixing appointments:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

fixAppointments(); 