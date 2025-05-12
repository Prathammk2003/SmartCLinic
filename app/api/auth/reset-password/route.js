import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongoose";
import User from "@/lib/models/User";
import crypto from "crypto";
import bcrypt from "bcryptjs";

// GET request to validate the token
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token is required" },
        { status: 400 }
      );
    }
    
    console.log("Validating reset token");
    await connectToDB();
    
    // Hash the provided token
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    
    // Find user with matching token that hasn't expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      console.log("Invalid or expired token");
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 400 }
      );
    }
    
    console.log("Token is valid for user:", user.email);
    return NextResponse.json(
      { success: true, message: "Token is valid" },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Error validating token:", error);
    return NextResponse.json(
      { success: false, message: "Failed to validate token" },
      { status: 500 }
    );
  }
}

// POST request to reset the password
export async function POST(request) {
  try {
    const { token, password } = await request.json();
    
    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: "Token and password are required" },
        { status: 400 }
      );
    }
    
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }
    
    console.log("Resetting password with token");
    await connectToDB();
    
    // Hash the provided token
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    
    // Find user with matching token that hasn't expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      console.log("Invalid or expired token");
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 400 }
      );
    }
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    // Save the user with updated password
    await user.save();
    
    console.log("Password reset successful for user:", user.email);
    
    return NextResponse.json(
      { success: true, message: "Password reset successful" },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { success: false, message: "Failed to reset password" },
      { status: 500 }
    );
  }
} 