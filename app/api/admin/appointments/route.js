import connectToDB from "@/lib/mongoose";
import Appointment from "@/lib/models/Appointment";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    await connectToDB();
    
    // Get all appointments with related details
    const appointments = await Appointment.find({})
      .populate('userId', 'name email phone')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      })
      .populate('slotId')
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({ 
      success: true, 
      data: appointments 
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch appointments" 
    }, { status: 500 });
  }
} 