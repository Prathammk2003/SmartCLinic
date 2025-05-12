import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongoose";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const password = searchParams.get("password") || "password123";
    
    if (!email) {
      return NextResponse.json({
        success: false,
        message: "Email is required"
      }, { status: 400 });
    }
    
    await connectToDB();
    
    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "User not found"
      }, { status: 404 });
    }
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update the user's password
    user.password = hashedPassword;
    await user.save();
    
    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
      data: {
        email,
        newPassword: password
      }
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to reset password",
      error: error.message
    }, { status: 500 });
  }
} 