import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongoose";
import User from "@/lib/models/User";
import mongoose from "mongoose";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// Helper function to get the current user ID from JWT token
const getCurrentUserId = async () => {
  try {
    // In Next.js 15, cookies() is async and must be awaited
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    
    if (!token) {
      console.log("No token found in cookies");
      return null;
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check different possible ID field names in the token
      // Common fields used for user IDs in JWT tokens
      const userId = decoded.id || decoded.userId || decoded._id || decoded.sub;
      
      console.log("Token decoded payload:", JSON.stringify(decoded));
      console.log("Token verified successfully for user:", userId);
      
      return userId;
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError.message);
      return null;
    }
  } catch (error) {
    console.error("Error accessing cookies:", error);
    return null;
  }
};

// GET handler to fetch user profile
export async function GET(req) {
  try {
    await connectToDB();
    
    // Get current user ID from token
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "Not authenticated" 
      }, { status: 401 });
    }
    
    const user = await User.findById(userId).select("-password");
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: "User not found" 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true,
      data: user 
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to fetch user profile", 
      error: error.message 
    }, { status: 500 });
  }
}

// PUT handler to update user profile
export async function PUT(req) {
  try {
    await connectToDB();
    
    // Get current user ID from token
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "Not authenticated" 
      }, { status: 401 });
    }
    
    const data = await req.json();
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: "User not found" 
      }, { status: 404 });
    }
    
    // Validate data
    if (!data) {
      return NextResponse.json({ 
        success: false, 
        message: "No data provided" 
      }, { status: 400 });
    }
    
    // Fields we allow to update
    const allowedFields = [
      'name', 
      'email', 
      'phone', 
      'dateOfBirth', 
      'gender', 
      'address', 
      'medicalHistory'
    ];
    
    // Update only allowed fields
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        user[field] = data[field];
      }
    });
    
    await user.save();
    
    return NextResponse.json({ 
      success: true, 
      data: user,
      message: "Profile updated successfully" 
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to update user profile", 
      error: error.message 
    }, { status: 500 });
  }
} 