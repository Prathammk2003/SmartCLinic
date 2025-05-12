import { NextResponse } from 'next/server';
import connectToDB from '@/lib/mongoose';
import Appointment from '@/lib/models/Appointment';
import User from '@/lib/models/User';
import Doctor from '@/lib/models/Doctor';
import AppointmentSlot from '@/lib/models/AppointmentSlot';
import { sendAppointmentReminder } from '@/lib/twilio';

// Helper function to get date ranges for different reminder types
function getDateRangeForReminders(reminderType) {
  const now = new Date();
  
  switch (reminderType) {
    case 'day-before': {
      // Tomorrow's date range (for day-before reminders)
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const endOfTomorrow = new Date(tomorrow);
      endOfTomorrow.setHours(23, 59, 59, 999);
      
      return { start: tomorrow, end: endOfTomorrow };
    }
    
    case '12-hour': {
      // 12 hours from now date range
      const twelveHoursFromNow = new Date(now);
      twelveHoursFromNow.setHours(now.getHours() + 12);
      
      const thirteenHoursFromNow = new Date(now);
      thirteenHoursFromNow.setHours(now.getHours() + 13);
      
      return { start: twelveHoursFromNow, end: thirteenHoursFromNow };
    }
    
    case '1-hour': {
      // 1 hour from now date range
      const oneHourFromNow = new Date(now);
      oneHourFromNow.setHours(now.getHours() + 1);
      
      const twoHoursFromNow = new Date(now);
      twoHoursFromNow.setHours(now.getHours() + 2);
      
      return { start: oneHourFromNow, end: twoHoursFromNow };
    }
    
    default:
      return null;
  }
}

// Helper function to create reminder message based on type
function getReminderMessage(reminderType, doctor, slot, appointmentType) {
  const formattedDate = new Date(slot.date).toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
  
  switch (reminderType) {
    case 'day-before':
      return `
REMINDER: Your appointment with Dr. ${doctor.name} is tomorrow!
Date: ${formattedDate}
Time: ${slot.startTime}
Type: ${appointmentType}
Location: Medical Center, First Floor
Please arrive 15 minutes early. Reply CANCEL if you need to reschedule.
`;
      
    case '12-hour':
      return `
REMINDER: Your appointment with Dr. ${doctor.name} is in approximately 12 hours!
Date: ${formattedDate}
Time: ${slot.startTime}
Type: ${appointmentType}
Location: Medical Center, First Floor
Please remember to arrive 15 minutes early.
`;
      
    case '1-hour':
      return `
URGENT REMINDER: Your appointment with Dr. ${doctor.name} is in 1 HOUR!
Time: ${slot.startTime}
Location: Medical Center, First Floor
We're looking forward to seeing you soon.
`;
      
    default:
      return `Reminder for your appointment with Dr. ${doctor.name} at ${slot.startTime} on ${formattedDate}.`;
  }
}

// POST - Send reminders for appointments
export async function POST(request) {
  try {
    // Check for API key or authorization
    const { key, reminderType = 'day-before' } = await request.json();
    
    if (key !== process.env.REMINDER_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectToDB();
    
    // Validate reminder type
    if (!['day-before', '12-hour', '1-hour'].includes(reminderType)) {
      return NextResponse.json(
        { error: 'Invalid reminder type. Must be day-before, 12-hour, or 1-hour' },
        { status: 400 }
      );
    }
    
    // Get appropriate date range based on reminder type
    const dateRange = getDateRangeForReminders(reminderType);
    if (!dateRange) {
      return NextResponse.json(
        { error: 'Failed to generate date range for reminders' },
        { status: 500 }
      );
    }
    
    console.log(`Sending ${reminderType} reminders for appointment slots between:`, {
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString()
    });
    
    // Find all confirmed appointments for the time range
    const slots = await AppointmentSlot.find({
      date: {
        $gte: dateRange.start,
        $lte: dateRange.end
      }
    }).lean();
    
    if (!slots.length) {
      return NextResponse.json({
        success: true,
        message: `No appointments found for ${reminderType} reminders in the specified time range`,
        count: 0,
        reminderType
      });
    }
    
    // Get slot IDs
    const slotIds = slots.map(slot => slot._id);
    
    // Find appointments with these slots
    const appointments = await Appointment.find({
      slotId: { $in: slotIds },
      status: 'confirmed'
    }).lean();
    
    if (!appointments.length) {
      return NextResponse.json({
        success: true,
        message: `No confirmed appointments found for ${reminderType} reminders in the specified time range`,
        count: 0,
        reminderType
      });
    }
    
    console.log(`Found ${appointments.length} appointments to send ${reminderType} reminders`);
    
    // Send reminders for each appointment
    const reminderResults = [];
    
    for (const appointment of appointments) {
      // Find the user, doctor, and slot for this appointment
      const [user, doctor, slot] = await Promise.all([
        User.findById(appointment.userId).lean(),
        Doctor.findById(appointment.doctorId).lean(),
        AppointmentSlot.findById(appointment.slotId).lean()
      ]);
      
      if (!user || !doctor || !slot) {
        console.error(`Missing data for appointment ${appointment._id}`);
        reminderResults.push({
          appointmentId: appointment._id,
          success: false,
          error: 'Missing user, doctor, or slot data'
        });
        continue;
      }
      
      // Skip if user has no phone number
      if (!user.phone) {
        console.log(`User ${user._id} has no phone number, skipping reminder`);
        reminderResults.push({
          appointmentId: appointment._id,
          success: false,
          error: 'User has no phone number'
        });
        continue;
      }
      
      // Create appointment object with slot details
      const appointmentWithDetails = {
        ...appointment,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime
      };
      
      // Get custom message based on reminder type
      const customMessage = getReminderMessage(reminderType, doctor, slot, appointment.type);
      
      // Send reminder
      const result = await sendAppointmentReminder(
        appointmentWithDetails, 
        user, 
        doctor,
        customMessage
      );
      
      reminderResults.push({
        appointmentId: appointment._id,
        success: result.success,
        error: result.error,
        messageSid: result.messageSid,
        reminderType
      });
    }
    
    // Count successful reminders
    const successCount = reminderResults.filter(r => r.success).length;
    
    return NextResponse.json({
      success: true,
      message: `Sent ${successCount} ${reminderType} reminders out of ${appointments.length} scheduled appointments`,
      count: appointments.length,
      successCount,
      reminderType,
      results: reminderResults
    });
    
  } catch (error) {
    console.error('Error sending appointment reminders:', error);
    return NextResponse.json(
      { error: 'Failed to send reminders' },
      { status: 500 }
    );
  }
} 