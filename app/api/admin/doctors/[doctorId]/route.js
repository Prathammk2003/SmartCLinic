import connectToDB from "@/lib/mongoose";
import Doctor from "@/lib/models/Doctor";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
  try {
    const { doctorId } = params;
    const { isVerified } = await request.json();
    
    if (isVerified === undefined) {
      return NextResponse.json({ 
        success: false, 
        error: "isVerified field is required" 
      }, { status: 400 });
    }

    await connectToDB();
    
    const updatedDoctor = await Doctor.findByIdAndUpdate(
      doctorId,
      { $set: { isVerified } },
      { new: true }
    );
    
    if (!updatedDoctor) {
      return NextResponse.json({ 
        success: false, 
        error: "Doctor not found" 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: updatedDoctor
    }, { status: 200 });
  } catch (error) {
    console.error("Error updating doctor verification:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to update doctor verification status" 
    }, { status: 500 });
  }
} 