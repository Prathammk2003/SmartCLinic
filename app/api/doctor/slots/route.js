import connectToDB from "@/lib/mongoose";
import User from "@/lib/models/User";
import Doctor from "@/lib/models/Doctor";
import AppointmentSlot from "@/lib/models/AppointmentSlot";
import { NextResponse } from "next/server";
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
    return null;
  }
}

// GET - Fetch all slots for the logged-in doctor
export async function GET(request) {
  try {
    await connectToDB();
    
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
    
    // Get doctor's slots
    const slots = await AppointmentSlot.find({ doctorId: doctor._id })
      .sort({ date: 1, startTime: 1 })
      .lean();
    
    return NextResponse.json({ 
      success: true, 
      data: slots 
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching slots:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch slots" 
    }, { status: 500 });
  }
}

// POST - Create a new slot for the logged-in doctor
export async function POST(request) {
  try {
    await connectToDB();
    
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "Unauthorized - Invalid or missing token" 
      }, { status: 401 });
    }
    
    // Find user and check if doctor
    const user = await User.findById(userId);
    if (!user || user.role !== 'doctor') {
      return NextResponse.json({ 
        success: false, 
        message: "Unauthorized - Not a doctor account" 
      }, { status: 403 });
    }
    
    // Find doctor ID from user ID
    const doctor = await Doctor.findOne({ userId: userId });
    if (!doctor) {
      return NextResponse.json({ 
        success: false, 
        message: "Doctor profile not found" 
      }, { status: 404 });
    }
    
    // Get slot data from request
    const slotData = await request.json();
    const { date, startTime, endTime, isAvailable, createHourlySlots, duration } = slotData;
    
    // Validate required fields
    if (!date) {
      return NextResponse.json({ 
        success: false, 
        message: "Missing required field: date" 
      }, { status: 400 });
    }
    
    // If createHourlySlots is true but start/end times not provided, use defaults
    const actualStartTime = createHourlySlots && !startTime ? "09:00" : startTime;
    const actualEndTime = createHourlySlots && !endTime ? "17:00" : endTime;
    
    // Validate that times are provided or defaulted
    if (!actualStartTime || !actualEndTime) {
      return NextResponse.json({ 
        success: false, 
        message: "Missing required fields: startTime, endTime" 
      }, { status: 400 });
    }
    
    // Function to parse time string to hours and minutes
    const parseTime = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return { hours, minutes };
    };
    
    // Function to format hours and minutes to time string
    const formatTime = (hours, minutes) => {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };
    
    const createdSlots = [];
    
    // Create hourly slots if requested
    if (createHourlySlots) {
      const start = parseTime(actualStartTime);
      const end = parseTime(actualEndTime);
      
      // Calculate total minutes
      const startMinutes = start.hours * 60 + start.minutes;
      const endMinutes = end.hours * 60 + end.minutes;
      
      // Ensure end time is after start time
      if (endMinutes <= startMinutes) {
        return NextResponse.json({ 
          success: false, 
          message: "End time must be after start time" 
        }, { status: 400 });
      }
      
      // Create slots at one-hour intervals
      for (let currentMinutes = startMinutes; currentMinutes < endMinutes; currentMinutes += 60) {
        const slotStartHours = Math.floor(currentMinutes / 60);
        const slotStartMinutes = currentMinutes % 60;
        
        // Calculate end time (1 hour later)
        const slotEndMinutes = currentMinutes + 60;
        const slotEndHours = Math.floor(slotEndMinutes / 60);
        const slotEndMinutesRemainder = slotEndMinutes % 60;
        
        // Skip if we would exceed the end time
        if (slotEndMinutes > endMinutes) {
          continue;
        }
        
        const slotStartTime = formatTime(slotStartHours, slotStartMinutes);
        const slotEndTime = formatTime(slotEndHours, slotEndMinutesRemainder);
        
        // Create slot
        const slot = await AppointmentSlot.create({
          doctorId: doctor._id,
          date: new Date(date),
          startTime: slotStartTime,
          endTime: slotEndTime,
          isAvailable: isAvailable !== undefined ? isAvailable : true,
          duration: duration || 60 // Use provided duration or default to 60 minutes
        });
        
        createdSlots.push(slot);
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `Created ${createdSlots.length} hourly slots`,
        data: createdSlots 
      }, { status: 201 });
    } else {
      // Create a single slot (original behavior)
      const newSlot = await AppointmentSlot.create({
        doctorId: doctor._id,
        date: new Date(date),
        startTime: actualStartTime,
        endTime: actualEndTime,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        duration: duration || 30 // Use provided duration or default to 30 minutes
      });
      
      return NextResponse.json({ 
        success: true, 
        data: newSlot 
      }, { status: 201 });
    }
  } catch (error) {
    console.error("Error creating slot:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to create slot",
      error: error.message
    }, { status: 500 });
  }
} 