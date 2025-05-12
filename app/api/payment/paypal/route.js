import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectToDB from '@/lib/mongoose';
import Appointment from '@/lib/models/Appointment';
import mongoose from 'mongoose';

// Helper function to verify user token
const verifyUserToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Create a PayPal order
export async function POST(request) {
  try {
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
    
    // Get user ID from token - check both id and userId fields
    const userId = decodedToken.id || decodedToken.userId;
    
    console.log('Creating PayPal order:', { 
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
    
    // Store order data in temporary database record or session
    // This is a placeholder - in a real app you might want to create a temporary record
    // or use a session to store this data until payment is completed
    
    // For now, we'll return a mock order ID and the actual doctor/slot/user IDs
    // that will be needed for appointment creation after payment
    return NextResponse.json({
      orderId: 'TEMP_' + Date.now(),
      paymentData: {
        userId,
        doctorId,
        slotId,
        appointmentDetails,
        amount
      }
    });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

// Capture a PayPal payment and create appointment
export async function PUT(request) {
  try {
    await connectToDB();
    
    const { 
      paymentId, 
      orderId,
      paymentData
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
    
    // Get user ID from token and verify it matches the payment data
    const userId = decodedToken.id || decodedToken.userId;
    
    console.log('Processing payment with data:', { 
      userId, 
      paymentData 
    });
    
    // Check if the user ID matches the payment data
    if (paymentData.userId && userId !== paymentData.userId) {
      console.error('User ID mismatch:', { tokenUserId: userId, paymentDataUserId: paymentData.userId });
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      );
    }
    
    // In a production app, you would verify the payment with PayPal here
    // For this demo, we'll assume the payment is valid
    
    // Create appointment with payment information
    const { doctorId, slotId, appointmentDetails, amount } = paymentData;
    
    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(doctorId) || 
        !mongoose.Types.ObjectId.isValid(slotId) || 
        !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
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
      status: 'confirmed', // Directly confirmed since payment is complete
      paymentStatus: 'completed',
      paymentId,
      paymentAmount: amount,
      paymentDate: new Date(),
      paymentMethod: 'paypal'
    });
    
    await newAppointment.save();
    
    // Update the slot to be unavailable
    // In a real app, you'd update the slot status here
    
    return NextResponse.json({
      success: true,
      message: 'Payment processed and appointment created',
      appointmentId: newAppointment._id
    });
  } catch (error) {
    console.error('Error capturing PayPal payment:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
} 