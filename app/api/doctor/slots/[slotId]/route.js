import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AppointmentSlot from "@/lib/models/AppointmentSlot";
import connectToDB from "@/lib/mongoose";
import User from "@/lib/models/User";
import Doctor from "@/lib/models/Doctor";
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// GET - Fetch a specific slot
export async function GET(req, { params }) {
  try {
    await dbConnect();
    
    // Properly await params in Next.js 15
    const { slotId } = await params;
    
    const slot = await AppointmentSlot.findById(slotId);
    
    if (!slot) {
      return NextResponse.json({
        success: false,
        message: "Appointment slot not found"
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: slot
    });
  } catch (error) {
    console.error("Error fetching slot:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch appointment slot",
      error: error.message
    }, { status: 500 });
  }
}

// Helper function to get user ID from token
async function getUserIdFromToken(request) {
  // Get the token from cookies or authorization header
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get('token');
  const token = tokenCookie ? tokenCookie.value : null;
  
  // If no token in cookies, check authorization header
  const authHeader = request.headers.get('authorization');
  const headerToken = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.split(' ')[1] 
    : null;
  
  // Use token from cookie or header
  const userToken = token || headerToken;
  
  // If no token found, return null
  if (!userToken) {
    return null;
  }
  
  // Verify token
  try {
    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

// DELETE - Delete a specific slot
export async function DELETE(req, { params }) {
  try {
    await connectToDB();

    // Properly await params in Next.js 15
    const { slotId } = await params;
    
    if (!slotId) {
      return NextResponse.json({
        success: false,
        message: "Slot ID is required"
      }, { status: 400 });
    }
    
    const userId = await getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized - Invalid or missing token" 
      }, { status: 401 });
    }
    
    // Find user and check if doctor
    const user = await User.findById(userId);
    if (!user || user.role !== 'doctor') {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized - Not a doctor account" 
      }, { status: 403 });
    }
    
    // Find doctor ID from user ID
    const doctor = await Doctor.findOne({ userId: userId });
    if (!doctor) {
      return NextResponse.json({ 
        success: false, 
        error: "Doctor profile not found" 
      }, { status: 404 });
    }
    
    // Find the slot
    const slot = await AppointmentSlot.findById(slotId);
    if (!slot) {
      return NextResponse.json({ 
        success: false, 
        error: "Slot not found" 
      }, { status: 404 });
    }
    
    // Check if slot belongs to this doctor
    if (slot.doctorId.toString() !== doctor._id.toString()) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized - Not your slot" 
      }, { status: 403 });
    }
    
    // Check if slot is already booked
    if (slot.appointmentId) {
      return NextResponse.json({ 
        success: false, 
        error: "Cannot delete a slot that has an appointment" 
      }, { status: 400 });
    }
    
    // Delete the slot
    await AppointmentSlot.findByIdAndDelete(slotId);
    
    return NextResponse.json({ 
      success: true, 
      message: "Slot deleted successfully" 
    }, { status: 200 });
  } catch (error) {
    console.error("Error deleting slot:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to delete slot" 
    }, { status: 500 });
  }
}

// PATCH - Update a specific slot
export async function PATCH(request, { params }) {
  try {
    await connectToDB();
    
    // Properly await params in Next.js 15
    const { slotId } = await params;
    if (!slotId) {
      return NextResponse.json({ 
        success: false, 
        error: "Slot ID is required" 
      }, { status: 400 });
    }
    
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized - Invalid or missing token" 
      }, { status: 401 });
    }
    
    // Find user and check if doctor
    const user = await User.findById(userId);
    if (!user || user.role !== 'doctor') {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized - Not a doctor account" 
      }, { status: 403 });
    }
    
    // Find doctor ID from user ID
    const doctor = await Doctor.findOne({ userId: userId });
    if (!doctor) {
      return NextResponse.json({ 
        success: false, 
        error: "Doctor profile not found" 
      }, { status: 404 });
    }
    
    // Find the slot
    const slot = await AppointmentSlot.findById(slotId);
    if (!slot) {
      return NextResponse.json({ 
        success: false, 
        error: "Slot not found" 
      }, { status: 404 });
    }
    
    // Check if slot belongs to this doctor
    if (slot.doctorId.toString() !== doctor._id.toString()) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized - Not your slot" 
      }, { status: 403 });
    }
    
    // Get update data
    const updateData = await request.json();
    const { date, startTime, endTime, isAvailable } = updateData;
    
    // Update the slot
    const updatedSlot = await AppointmentSlot.findByIdAndUpdate(
      slotId,
      {
        ...(date && { date: new Date(date) }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(isAvailable !== undefined && { isAvailable })
      },
      { new: true }
    );
    
    return NextResponse.json({ 
      success: true, 
      data: updatedSlot 
    }, { status: 200 });
  } catch (error) {
    console.error("Error updating slot:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to update slot" 
    }, { status: 500 });
  }
} 