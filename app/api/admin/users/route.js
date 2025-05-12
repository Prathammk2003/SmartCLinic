import connectToDB from "@/lib/mongoose";
import User from "@/lib/models/User";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    await connectToDB();
    
    // Get all users (in a real app, you might want to add pagination)
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    
    return NextResponse.json({ 
      success: true, 
      data: users 
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch users" 
    }, { status: 500 });
  }
}