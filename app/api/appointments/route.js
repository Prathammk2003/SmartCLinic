import { NextResponse } from 'next/server';
import connectToDB from "@/lib/mongoose";
import Appointment from '@/lib/models/Appointment';
import AppointmentSlot from '@/lib/models/AppointmentSlot';
import User from '@/lib/models/User';
import Doctor from '@/lib/models/Doctor';
import mongoose from 'mongoose';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

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
    console.error("Token verification error:", error);
    return null;
  }
}

// Create new appointment
export async function POST(request) {
  try {
    await connectToDB();
    
    // Get appointment data from request body
    const data = await request.json();
    
    // Get the token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ 
        success: false, 
        message: "Not authenticated" 
      }, { status: 401 });
    }
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid token" 
      }, { status: 401 });
    }
    
    // Get user ID from token
    const userId = decoded.id || decoded.userId;
    
    // Create appointment with user ID from token
    const appointment = new Appointment({
      ...data,
      userId,
      status: data.status || 'scheduled',
      paymentStatus: data.paymentStatus || 'pending'
    });
    
    await appointment.save();
    
    return NextResponse.json({ 
      success: true, 
      data: appointment,
      message: "Appointment created successfully" 
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to create appointment", 
      error: error.message 
    }, { status: 500 });
  }
}

// Get all appointments or filter by patient or doctor
export async function GET(request) {
  try {
    await connectToDB();
    
    // Get the token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ 
        success: false, 
        message: "Not authenticated" 
      }, { status: 401 });
    }
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid token" 
      }, { status: 401 });
    }
    
    // Get user ID from token
    const userId = decoded.id || decoded.userId;
    
    // Fetch all appointments for this user
    const appointments = await Appointment.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({ 
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to fetch appointments", 
      error: error.message 
    }, { status: 500 });
  }
} 