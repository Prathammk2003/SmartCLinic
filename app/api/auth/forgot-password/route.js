import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongoose";
import User from "@/lib/models/User";
import crypto from "crypto";

export async function POST(request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, message: "Please provide an email address" },
        { status: 400 }
      );
    }
    
    console.log("Password reset requested for:", email);
    await connectToDB();
    
    // Find the user with this email
    const user = await User.findOne({ email });
    
    // Always return a success response even if no user found
    // This prevents user enumeration attacks
    if (!user) {
      console.log("No user found with email:", email);
      return NextResponse.json(
        { success: true, message: "If your email is registered, you will receive a password reset link" },
        { status: 200 }
      );
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    
    // Hash the token for security
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    
    // Set token and expiry on user document
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 3600000; // Token valid for 1 hour
    await user.save();
    
    // In a real application, you would send an email here
    // For this demo, we'll just log the reset link
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password/${resetToken}`;
    console.log("Password reset link:", resetUrl);
    
    return NextResponse.json(
      { 
        success: true, 
        message: "If your email is registered, you will receive a password reset link",
        // Include token in response for testing purposes only
        // In production, remove this and send email only
        devInfo: {
          resetToken,
          resetUrl
        }
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Error in forgot-password route:", error);
    
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 