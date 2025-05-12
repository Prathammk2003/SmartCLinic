import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Doctor from "@/lib/models/Doctor";
import User from "@/lib/models/User";
import AppointmentSlot from "@/lib/models/AppointmentSlot";

export async function GET(request) {
  try {
    await dbConnect();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const count = parseInt(searchParams.get("count") || "5");
    
    console.log("Creating test slots for doctor with email:", email);
    console.log("Number of slots to create:", count);
    
    // Find the doctor by email
    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email parameter is required" },
        { status: 400 }
      );
    }
    
    // Find user with doctor role
    const user = await User.findOne({ email, role: "doctor" });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Doctor not found with this email" },
        { status: 404 }
      );
    }
    
    // Find doctor profile
    const doctor = await Doctor.findOne({ userId: user._id });
    if (!doctor) {
      return NextResponse.json(
        { success: false, message: "Doctor profile not found" },
        { status: 404 }
      );
    }
    
    console.log("Found doctor:", doctor._id);
    
    // Create slots for the next 5 days, 3 slots per day
    const slots = [];
    const now = new Date();
    
    for (let day = 1; day <= Math.min(count, 15); day++) {
      const slotDate = new Date(now);
      slotDate.setDate(now.getDate() + day);
      
      // Create 3 time slots for this day
      const timeSlots = [
        { start: "09:00", end: "10:00" },
        { start: "11:00", end: "12:00" },
        { start: "14:00", end: "15:00" }
      ];
      
      for (const time of timeSlots) {
        slots.push({
          doctorId: doctor._id,
          date: slotDate,
          startTime: time.start,
          endTime: time.end,
          isAvailable: true
        });
      }
    }
    
    // Check if slots already exist for the doctor
    const existingSlots = await AppointmentSlot.find({ doctorId: doctor._id });
    if (existingSlots.length > 0) {
      console.log(`Found ${existingSlots.length} existing slots for doctor`);
    }
    
    // Insert slots into database
    const result = await AppointmentSlot.insertMany(slots);
    
    return NextResponse.json(
      { 
        success: true, 
        message: `Created ${result.length} test slots for doctor`,
        data: {
          doctor: { 
            id: doctor._id, 
            name: user.name, 
            specialization: doctor.specialization
          },
          slotsCreated: result.length,
          totalSlots: existingSlots.length + result.length
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating test slots:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create test slots", error: error.message },
      { status: 500 }
    );
  }
} 