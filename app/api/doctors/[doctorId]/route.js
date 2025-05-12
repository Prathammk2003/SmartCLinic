import connectToDB from "@/lib/mongoose";
import { NextResponse } from "next/server";
import Doctor from "@/lib/models/Doctor";
import mongoose from "mongoose";

// GET - Fetch a specific doctor by ID
export async function GET(request, context) {
  try {
    await connectToDB();
    
    // In Next.js 13+, we need to await params before destructuring
    const { doctorId } = await context.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid doctor ID format" 
      }, { status: 400 });
    }
    
    // Find the doctor with user details populated
    const doctor = await Doctor.findById(doctorId)
      .populate('userId', 'name email profileImage')
      .lean();
    
    if (!doctor) {
      return NextResponse.json({ 
        success: false, 
        message: "Doctor not found" 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      doctor 
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching doctor:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to fetch doctor",
      error: error.message 
    }, { status: 500 });
  }
} 