import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongoose";
import Appointment from "@/lib/models/Appointment";

// GET - Check the status of an appointment
export async function GET(request, context) {
  try {
    await connectToDB();
    
    // Await params before destructuring
    const { appointmentId } = await context.params;
    
    const appointment = await Appointment.findById(appointmentId)
      .select("status updatedAt")
      .lean();
    
    if (!appointment) {
      return NextResponse.json(
        { success: false, message: "Appointment not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        status: appointment.status,
        updatedAt: appointment.updatedAt
      }
    });
  } catch (error) {
    console.error("Error checking appointment status:", error);
    return NextResponse.json(
      { success: false, message: "Failed to check appointment status" },
      { status: 500 }
    );
  }
} 