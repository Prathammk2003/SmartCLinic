import connectToDB from "@/lib/mongoose";
import { NextResponse } from "next/server";
import AppointmentSlot from "@/lib/models/AppointmentSlot";
import mongoose from "mongoose";

// GET - Fetch a specific slot by ID
export async function GET(request, context) {
  try {
    await connectToDB();
    
    // In Next.js 13+, we need to await params before destructuring
    const { slotId } = await context.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(slotId)) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid slot ID format" 
      }, { status: 400 });
    }
    
    // Find the slot
    const slot = await AppointmentSlot.findById(slotId).lean();
    
    if (!slot) {
      return NextResponse.json({ 
        success: false, 
        message: "Slot not found" 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      slot 
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching slot:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to fetch slot",
      error: error.message 
    }, { status: 500 });
  }
} 