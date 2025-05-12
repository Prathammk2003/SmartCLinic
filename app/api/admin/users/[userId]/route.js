import connectToDB from "@/lib/mongoose";
import User from "@/lib/models/User";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
  try {
    const { userId } = params;
    const { isActive } = await request.json();
    
    if (isActive === undefined) {
      return NextResponse.json({ 
        success: false, 
        error: "isActive field is required" 
      }, { status: 400 });
    }

    await connectToDB();
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { isActive } },
      { new: true }
    );
    
    if (!updatedUser) {
      return NextResponse.json({ 
        success: false, 
        error: "User not found" 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: updatedUser
    }, { status: 200 });
  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to update user status" 
    }, { status: 500 });
  }
} 