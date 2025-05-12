import connectToDB from "@/lib/mongoose";
import User from "@/lib/models/User";
import { NextResponse } from "next/server";
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    await connectToDB();
    
    // Get the token from cookies
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('token');
    const token = tokenCookie ? tokenCookie.value : null;
    
    // If no token in cookies, check authorization header
    const authHeader = request.headers.get('authorization');
    const headerToken = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.split(' ')[1] 
      : null;
    
    // Use token from cookie or header
    const userToken = token || headerToken;
    
    // If no token found, return unauthorized
    if (!userToken) {
      console.log("No token found in cookies or headers");
      return NextResponse.json({ 
        success: false, 
        message: "Unauthorized - No token provided" 
      }, { status: 401 });
    }
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(userToken, process.env.JWT_SECRET);
      console.log("Token verified successfully for user:", decoded.userId);
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json({ 
        success: false, 
        message: "Unauthorized - Invalid token" 
      }, { status: 401 });
    }
    
    // Find user by ID from token
    const user = await User.findById(decoded.userId).lean();
    
    if (!user) {
      console.log("User not found for ID:", decoded.userId);
      return NextResponse.json({ 
        success: false, 
        message: "User not found" 
      }, { status: 404 });
    }
    
    // Don't send password in the response
    const { password, ...userData } = user;
    
    return NextResponse.json({ 
      success: true, 
      data: userData 
    }, { status: 200 });
  } catch (error) {
    console.error("Error in /api/users/me:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    }, { status: 500 });
  }
} 