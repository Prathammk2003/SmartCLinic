import connectToDB from "@/lib/mongoose";
import { Appointment, Doctor, User, AppointmentSlot, getRegisteredModels } from "@/lib/models";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export async function GET(request) {
  try {
    await connectToDB();
    
    // Log registered models to check if Doctor is registered
    console.log("Registered models:", getRegisteredModels());
    
    // Get token from cookies
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("token");
    
    if (!tokenCookie) {
      return NextResponse.json({ 
        success: false, 
        message: "Unauthorized - please log in" 
      }, { status: 401 });
    }
    
    // Verify token and get user ID
    let userId;
    try {
      const decoded = jwt.verify(tokenCookie.value, process.env.JWT_SECRET);
      userId = decoded.userId;
      console.log("Getting appointments for authenticated user:", userId);
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json({ 
        success: false, 
        message: "Invalid authentication token" 
      }, { status: 401 });
    }
    
    // Ensure userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("Invalid userId format:", userId);
      return NextResponse.json({ 
        success: false, 
        message: "Invalid user ID format" 
      }, { status: 400 });
    }
    
    // Convert string ID to ObjectId
    const objectId = new mongoose.Types.ObjectId(userId);
    
    try {
      // Simple query first to verify Appointment model is working
      console.log("Attempting to fetch appointments with model:", Appointment.modelName);
      const count = await Appointment.countDocuments();
      console.log(`Total appointments in database: ${count}`);
      
      // Get all appointments for the user
      const appointments = await Appointment.find({ userId: objectId });
      console.log(`Found ${appointments.length} raw appointments`);
      
      // Use a simplified populate approach
      const populatedAppointments = await Appointment.find({ userId: objectId })
        .populate({
          path: 'doctorId',
          select: '_id specialization consultationFee'
        })
        .populate({
          path: 'slotId',
          select: '_id date startTime endTime'
        });
      
      console.log(`Populated ${populatedAppointments.length} appointments for user ${userId}`);
      
      return NextResponse.json({ 
        success: true, 
        data: populatedAppointments 
      }, { status: 200 });
    } catch (innerError) {
      console.error("Error with appointments query:", innerError);
      return NextResponse.json({ 
        success: false, 
        message: "Error querying appointments",
        error: innerError.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error fetching user appointments:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to fetch appointments",
      error: error.message
    }, { status: 500 });
  }
} 