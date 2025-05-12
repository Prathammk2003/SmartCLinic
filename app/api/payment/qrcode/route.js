import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectToDB from '@/lib/mongoose';
import Appointment from '@/lib/models/Appointment';
import Doctor from '@/lib/models/Doctor';
import User from '@/lib/models/User';
import AppointmentSlot from '@/lib/models/AppointmentSlot';
import mongoose from 'mongoose';
import { sendAppointmentConfirmation } from '@/lib/twilio';

// Helper function to verify user token
const verifyUserToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Create a QR code payment intent
export async function POST(request) {
  try {
    await connectToDB();
    const { doctorId, slotId, appointmentDetails, amount } = await request.json();
    
    // Get user token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Verify token
    const decodedToken = verifyUserToken(token);
    if (!decodedToken) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // Get user ID from token
    const userId = decodedToken.id || decodedToken.userId;
    
    console.log('Creating QR code payment:', { 
      userId, 
      doctorId, 
      slotId, 
      amount 
    });
    
    // Validate data
    if (!doctorId || !slotId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Get doctor details to include QR code information
    const doctor = await Doctor.findById(doctorId).lean();
    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      );
    }
    
    // Generate a payment ID
    const paymentId = `QR_${Date.now()}_${userId.substring(0, 5)}`;
    
    // Return payment information
    return NextResponse.json({
      paymentId,
      doctorName: doctor.name,
      doctorQrInfo: doctor.paymentQrInfo || {
        accountName: doctor.name,
        accountDetails: 'Payment account details will be displayed here'
      },
      paymentData: {
        userId,
        doctorId,
        slotId,
        appointmentDetails,
        amount
      }
    });
  } catch (error) {
    console.error('Error creating QR code payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}

// Confirm a QR code payment
export async function PUT(request) {
  try {
    await connectToDB();
    
    const { 
      paymentId, 
      doctorId,
      slotId,
      appointmentDetails,
      amount
    } = await request.json();
    
    // Get user token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Verify token
    const decodedToken = verifyUserToken(token);
    if (!decodedToken) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // Get user ID from token
    const userId = decodedToken.id || decodedToken.userId;
    
    console.log('Processing QR payment confirmation:', { 
      userId,
      paymentId,
      doctorId,
      slotId
    });
    
    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(doctorId) || 
        !mongoose.Types.ObjectId.isValid(slotId) || 
        !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    // Check if slot is available or already booked
    const slot = await AppointmentSlot.findById(slotId).lean();
    if (!slot) {
      return NextResponse.json(
        { error: 'Appointment slot not found' },
        { status: 404 }
      );
    }
    
    // Check if this slot is already booked
    const existingAppointment = await Appointment.findOne({ 
      doctorId, 
      slotId 
    }).lean();
    
    if (existingAppointment) {
      // If the user has already booked this slot, return the existing appointment
      if (existingAppointment.userId.toString() === userId) {
        return NextResponse.json({
          success: true,
          message: 'You have already booked this appointment',
          appointmentId: existingAppointment._id,
          alreadyBooked: true
        });
      } else {
        // If another user has booked this slot
        return NextResponse.json(
          { error: 'This appointment slot is no longer available' },
          { status: 409 }
        );
      }
    }
    
    // Create the appointment
    const newAppointment = new Appointment({
      userId,
      doctorId,
      slotId,
      type: appointmentDetails.type,
      reason: appointmentDetails.reason,
      symptoms: appointmentDetails.symptoms || '',
      notes: appointmentDetails.notes || '',
      status: 'confirmed',
      paymentStatus: 'completed',
      paymentId,
      paymentAmount: amount,
      paymentDate: new Date(),
      paymentMethod: 'qrcode'
    });
    
    await newAppointment.save();
    
    // Update the slot to be unavailable
    await AppointmentSlot.findByIdAndUpdate(slotId, { isAvailable: false });
    
    // Fetch user and doctor details for SMS
    const [user, doctor] = await Promise.all([
      User.findById(userId).lean(),
      Doctor.findById(doctorId).lean()
    ]);
    
    // Send confirmation SMS if user has a phone number
    if (user?.phone) {
      // Create appointment object with slot details for SMS
      const appointmentWithDetails = {
        ...newAppointment.toObject(),
        date: slot.date,
        startTime: slot.startTime,
      };
      
      // Send SMS asynchronously - don't wait for result to respond to client
      sendAppointmentConfirmation(appointmentWithDetails, user, doctor)
        .then(result => {
          if (result.success) {
            console.log(`Appointment confirmation SMS sent to ${user.phone}`);
          } else {
            console.error(`Failed to send appointment confirmation SMS: ${result.error}`);
          }
        })
        .catch(error => {
          console.error('Error sending confirmation SMS:', error);
        });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Payment processed and appointment created',
      appointmentId: newAppointment._id
    });
  } catch (error) {
    console.error('Error confirming QR code payment:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
} 