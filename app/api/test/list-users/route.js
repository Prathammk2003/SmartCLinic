import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongoose";
import User from "@/lib/models/User";

export async function GET() {
  try {
    await connectToDB();
    
    // Find all users but don't include the password field
    const users = await User.find({}, { password: 0 }).lean();
    
    const safeUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    }));
    
    return NextResponse.json({ 
      success: true, 
      count: safeUsers.length,
      data: safeUsers 
    });
  } catch (error) {
    console.error("Error listing users:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to list users",
      error: error.message
    }, { status: 500 });
  }
} 