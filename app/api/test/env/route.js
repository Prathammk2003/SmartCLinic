import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check if important environment variables are set
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV || 'development',
      MONGO_URI: process.env.MONGO_URI ? 'Set ✓' : 'Not set ✗',
      JWT_SECRET: process.env.JWT_SECRET ? 'Set ✓' : 'Not set ✗',
    };
    
    // Check JWT Secret length (without revealing it)
    if (process.env.JWT_SECRET) {
      envCheck.JWT_SECRET_LENGTH = process.env.JWT_SECRET.length;
    }
    
    return NextResponse.json({
      success: true,
      message: "Environment variables check",
      data: envCheck
    });
  } catch (error) {
    console.error("Error checking environment:", error);
    
    return NextResponse.json({
      success: false,
      message: "Failed to check environment",
      error: error.message
    }, { status: 500 });
  }
} 