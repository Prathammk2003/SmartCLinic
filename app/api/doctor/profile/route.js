import connectToDB from "@/lib/mongoose";
import User from "@/lib/models/User";
import Doctor from "@/lib/models/Doctor";
import { NextResponse } from "next/server";
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    await connectToDB();
    
    // Get the token from cookies or authorization header
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
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized - No token provided" 
      }, { status: 401 });
    }
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized - Invalid token" 
      }, { status: 401 });
    }
    
    // Find user by ID from token
    const user = await User.findById(decoded.userId).lean();
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: "User not found" 
      }, { status: 404 });
    }
    
    // Check if user is a doctor
    if (user.role !== 'doctor') {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized - Not a doctor account" 
      }, { status: 403 });
    }
    
    // Find doctor profile
    const doctorProfile = await Doctor.findOne({ userId: user._id })
      .populate('userId', 'name email phone')
      .lean();
    
    if (!doctorProfile) {
      return NextResponse.json({ 
        success: false, 
        error: "Doctor profile not found" 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: doctorProfile 
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching doctor profile:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch doctor profile" 
    }, { status: 500 });
  }
} 