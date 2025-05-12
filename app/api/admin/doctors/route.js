import connectToDB from "@/lib/mongoose";
import Doctor from "@/lib/models/Doctor";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    await connectToDB();
    
    // Get all doctors with user details
    const doctors = await Doctor.find({})
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({ 
      success: true, 
      data: doctors 
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch doctors" 
    }, { status: 500 });
  }
} 