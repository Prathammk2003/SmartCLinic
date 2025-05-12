import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongoose";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email") || "test@example.com";
    const password = searchParams.get("password") || "password123";
    const name = searchParams.get("name") || "Test User";
    const role = searchParams.get("role") || "patient";
    
    console.log("Creating test user with email:", email);
    await connectToDB();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("User already exists, updating password");
      
      // Update password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      existingUser.password = hashedPassword;
      await existingUser.save();
      
      return NextResponse.json({
        success: true,
        message: "User password updated",
        data: {
          id: existingUser._id,
          email,
          name: existingUser.name,
          role: existingUser.role,
          password: password // Only shown for testing
        }
      });
    }
    
    // Create new user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const newUser = await User.create({
      email,
      password: hashedPassword,
      name,
      role,
      phone: "1234567890", // Default phone number
      gender: "other"
    });
    
    return NextResponse.json({
      success: true,
      message: "Test user created",
      data: {
        id: newUser._id,
        email,
        name,
        role,
        password: password // Only shown for testing
      }
    });
  } catch (error) {
    console.error("Error creating test user:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to create test user",
      error: error.message
    }, { status: 500 });
  }
} 