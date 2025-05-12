#!/usr/bin/env node

/**
 * Simple appointment reminder script
 * 
 * This script checks for upcoming appointments and sends reminders:
 * - 24 hours before appointment
 * - 12 hours before appointment
 * - 1 hour before appointment
 * 
 * Run this script hourly using cron:
 * 0 * * * * /path/to/node /path/to/appointment-reminders.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const mongoose = require('mongoose');
const twilio = require('twilio');
const { format, subHours, addHours } = require('date-fns');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/appointment-system';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
let twilioClient;
let isTwilioConfigured = false;

if (accountSid && authToken && twilioPhoneNumber) {
  twilioClient = twilio(accountSid, authToken);
  isTwilioConfigured = true;
  console.log('Twilio client initialized');
} else {
  console.log('Twilio not configured - SMS will be simulated');
}

// Define mongoose schemas
const UserSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String
});

const DoctorSchema = new mongoose.Schema({
  name: String,
  specialization: String
});

const SlotSchema = new mongoose.Schema({
  date: Date,
  startTime: String,
  endTime: String
});

const AppointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AppointmentSlot'
  },
  status: {
    type: String,
    enum: ['confirmed', 'completed', 'cancelled', 'rescheduled'],
    default: 'confirmed'
  },
  type: String,
  reason: String
});

// Initialize models (use existing ones if available)
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Doctor = mongoose.models.Doctor || mongoose.model('Doctor', DoctorSchema);
const AppointmentSlot = mongoose.models.AppointmentSlot || mongoose.model('AppointmentSlot', SlotSchema);
const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);

/**
 * Connect to MongoDB
 */
async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

/**
 * Send SMS using Twilio
 * @param {string} to - Recipient phone number
 * @param {string} body - Message content
 */
async function sendSMS(to, body) {
  // Format phone number
  let formattedNumber = to.replace(/\D/g, '');
  if (!to.startsWith('+')) {
    formattedNumber = `+${formattedNumber}`;
  }
  
  // If Twilio is not configured, simulate sending
  if (!isTwilioConfigured) {
    console.log(`SIMULATED SMS to: ${formattedNumber}`);
    console.log(`Message: ${body}`);
    return { success: true, simulated: true };
  }
  
  try {
    const message = await twilioClient.messages.create({
      body,
      from: twilioPhoneNumber,
      to: formattedNumber
    });
    console.log(`SMS sent successfully! SID: ${message.sid}`);
    return { success: true };
  } catch (error) {
    console.error(`Error sending SMS to ${formattedNumber}:`, error);
    return { success: false, error };
  }
}

/**
 * Create reminder message based on time until appointment
 */
function createReminderMessage(appointment, user, doctor, slot, reminderType) {
  const appointmentDate = new Date(slot.date);
  const formattedDate = format(appointmentDate, 'EEEE, MMMM do, yyyy');
  
  // Common template
  let message = `Hello ${user.name},\n\n`;
  
  // Customize based on reminder type
  if (reminderType === '24-hour') {
    message += `REMINDER: Your appointment with Dr. ${doctor.name} is tomorrow, ${formattedDate} at ${slot.startTime}.\n\n`;
    message += `Type: ${appointment.type}\n`;
    message += "Please arrive 15 minutes early and bring any relevant medical records.";
  } else if (reminderType === '12-hour') {
    message += `REMINDER: Your appointment with Dr. ${doctor.name} is in about 12 hours, ${formattedDate} at ${slot.startTime}.\n\n`;
    message += `Type: ${appointment.type}\n`;
    message += "We're looking forward to seeing you.";
  } else if (reminderType === '1-hour') {
    message += `URGENT REMINDER: Your appointment with Dr. ${doctor.name} is in 1 hour at ${slot.startTime}.\n\n`;
    message += "Please make sure you arrive on time.";
  }
  
  return message;
}

/**
 * Find appointments that need reminders
 */
async function findAppointmentsForReminders() {
  const now = new Date();
  
  // Time ranges for different reminder types
  const twentyFourHoursLower = subHours(now, 25); // 25-24 hours before
  const twentyFourHoursUpper = subHours(now, 23);
  
  const twelveHoursLower = subHours(now, 13); // 13-12 hours before
  const twelveHoursUpper = subHours(now, 11);
  
  const oneHourLower = subHours(now, 2); // 2-1 hours before
  const oneHourUpper = subHours(now, 0);
  
  // Find confirmed appointments with slots in the relevant time ranges
  const appointments = await Appointment.find({
    status: 'confirmed'
  }).populate('userId doctorId slotId');
  
  const reminders = {
    '24-hour': [],
    '12-hour': [],
    '1-hour': []
  };
  
  // Filter appointments based on their time
  for (const appointment of appointments) {
    if (!appointment.slotId || !appointment.slotId.date) {
      console.log(`Skipping appointment ${appointment._id} - missing slot data`);
      continue;
    }
    
    const appointmentDate = new Date(appointment.slotId.date);
    
    // Check if appointment falls within reminder windows
    if (appointmentDate >= twentyFourHoursLower && appointmentDate <= twentyFourHoursUpper) {
      reminders['24-hour'].push(appointment);
    } else if (appointmentDate >= twelveHoursLower && appointmentDate <= twelveHoursUpper) {
      reminders['12-hour'].push(appointment);
    } else if (appointmentDate >= oneHourLower && appointmentDate <= oneHourUpper) {
      reminders['1-hour'].push(appointment);
    }
  }
  
  return reminders;
}

/**
 * Send reminders for all appointments that need them
 */
async function sendReminders() {
  try {
    const remindersByType = await findAppointmentsForReminders();
    let remindersSent = 0;
    
    for (const [reminderType, appointments] of Object.entries(remindersByType)) {
      console.log(`Found ${appointments.length} appointments for ${reminderType} reminders`);
      
      for (const appointment of appointments) {
        const user = appointment.userId;
        const doctor = appointment.doctorId;
        const slot = appointment.slotId;
        
        if (!user || !doctor || !slot) {
          console.log(`Skipping appointment ${appointment._id} - missing data`);
          continue;
        }
        
        // Create reminder message
        const message = createReminderMessage(appointment, user, doctor, slot, reminderType);
        
        // Send SMS
        console.log(`Sending ${reminderType} reminder to ${user.name} for appointment with Dr. ${doctor.name}`);
        const result = await sendSMS(user.phone, message);
        
        if (result.success) {
          remindersSent++;
        }
      }
    }
    
    console.log(`Reminder check completed. Sent ${remindersSent} reminders.`);
  } catch (error) {
    console.error('Error processing reminders:', error);
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    await connectToDatabase();
    await sendReminders();
    console.log('Reminder process completed successfully');
  } catch (error) {
    console.error('Error in reminder process:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Execute script
main(); 