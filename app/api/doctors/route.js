import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongoose";
import Doctor from "@/lib/models/Doctor";
import User from "@/lib/models/User";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET(request) {
  try {
    await connectToDB();
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const specialization = searchParams.get("specialization");
    const search = searchParams.get("search");
    
    // Build query based on parameters
    let query = {};
    
    if (specialization) {
      query.specialization = specialization;
    }
    
    // Add search functionality
    if (search) {
      query.$or = [
        { specialization: { $regex: search, $options: "i" } },
        { "userId.name": { $regex: search, $options: "i" } }
      ];
    }
    
    // If no search term, just get all doctors matching the query
    const doctors = await Doctor.find(query)
      .populate("userId", "name email")
      .sort({ specialization: 1 });
    
    return NextResponse.json({
      success: true,
      data: doctors
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch doctors" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectToDB();

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

    // Check if user is a doctor
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== "doctor") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Not a doctor" },
        { status: 403 }
      );
    }

    // Get doctor data from request body
    const { specialization, experience, education, bio } = await request.json();

    // Validate required fields
    if (!specialization) {
      return NextResponse.json(
        { success: false, message: "Specialization is required" },
        { status: 400 }
      );
    }

    // Check if doctor profile already exists
    const existingDoctor = await Doctor.findOne({ userId: decoded.userId });
    if (existingDoctor) {
      return NextResponse.json(
        { success: false, message: "Doctor profile already exists" },
        { status: 400 }
      );
    }

    // Create new doctor profile
    const doctor = await Doctor.create({
      userId: decoded.userId,
      specialization,
      experience,
      education,
      bio,
    });

    return NextResponse.json(
      { success: true, data: doctor },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating doctor profile:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create doctor profile" },
      { status: 500 }
    );
  }
} 