import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongoose";
import Doctor from "@/lib/models/Doctor";
import AppointmentSlot from "@/lib/models/AppointmentSlot";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET(request, context) {
  try {
    await connectToDB();

    // Await params before destructuring
    const { doctorId } = await context.params;

    console.log("Fetching slots for doctor:", doctorId);

    // Check if the doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      console.log("Doctor not found with ID:", doctorId);
      return NextResponse.json(
        { success: false, message: "Doctor not found" },
        { status: 404 }
      );
    }

    // Get all slots for this doctor - use doctorId field from the model
    const slots = await AppointmentSlot.find({ doctorId: doctorId })
      .sort({ date: 1, startTime: 1 })
      .lean();

    console.log(`Found ${slots.length} slots for doctor ${doctorId}`);
    
    return NextResponse.json(
      { success: true, data: slots },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching doctor slots:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch slots", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request, context) {
  try {
    await connectToDB();
    
    // Await params before destructuring
    const { doctorId } = await context.params;

    // Get the token from cookies
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("token");
    const token = tokenCookie ? tokenCookie.value : null;

    // If no token in cookies, check authorization header
    const authHeader = request.headers.get("authorization");
    const headerToken = authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    // Use token from cookie or header
    const userToken = token || headerToken;

    // If no token found, return unauthorized
    if (!userToken) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    // Check if the user is the doctor
    if (decoded.userId !== doctorId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Not your profile" },
        { status: 403 }
      );
    }

    // Check if the doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return NextResponse.json(
        { success: false, message: "Doctor not found" },
        { status: 404 }
      );
    }

    // Get slot data from request body
    const { date, startTime, endTime, isAvailable = true } = await request.json();

    // Validate required fields
    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create new slot - use doctorId field from the model
    const slot = await AppointmentSlot.create({
      doctorId: doctorId,
      date,
      startTime,
      endTime,
      isAvailable,
    });

    return NextResponse.json(
      { success: true, data: slot },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating slot:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create slot", error: error.message },
      { status: 500 }
    );
  }
} 