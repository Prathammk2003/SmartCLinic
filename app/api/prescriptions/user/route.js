import connectToDB from "@/lib/mongoose";
import { Prescription, Doctor, User, getRegisteredModels } from "@/lib/models";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export async function GET(request) {
  try {
    await connectToDB();
    
    // Log registered models to check if Prescription is registered
    console.log("Registered models in prescriptions route:", getRegisteredModels());
    
    // Get token from cookies
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("token");
    
    if (!tokenCookie) {
      return NextResponse.json({ 
        success: false, 
        message: "Unauthorized - please log in" 
      }, { status: 401 });
    }
    
    // Verify token and get user ID
    let userId;
    try {
      const decoded = jwt.verify(tokenCookie.value, process.env.JWT_SECRET);
      userId = decoded.userId;
      console.log("Getting prescriptions for authenticated user:", userId);
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json({ 
        success: false, 
        message: "Invalid authentication token" 
      }, { status: 401 });
    }
    
    // Ensure userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("Invalid userId format:", userId);
      return NextResponse.json({ 
        success: false, 
        message: "Invalid user ID format" 
      }, { status: 400 });
    }
    
    // Convert string ID to ObjectId
    const objectId = new mongoose.Types.ObjectId(userId);
    
    try {
      // Check if Prescription model is properly loaded
      console.log("Attempting to fetch prescriptions with model:", Prescription?.modelName || "Model not available");
      
      // Get all prescriptions for the user with related details
      const prescriptions = await Prescription.find({ userId: objectId })
        .populate({
          path: 'doctorId',
          select: '_id specialization consultationFee'
        })
        .populate({
          path: 'appointmentId',
          select: '_id reason status'
        })
        .sort({ createdAt: -1 });
      
      console.log(`Found ${prescriptions.length} prescriptions for user ${userId}`);
      
      return NextResponse.json({ 
        success: true, 
        data: prescriptions 
      }, { status: 200 });
    } catch (innerError) {
      console.error("Error with prescriptions query:", innerError);
      return NextResponse.json({ 
        success: false, 
        message: "Error querying prescriptions",
        error: innerError.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error fetching user prescriptions:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to fetch prescriptions",
      error: error.message 
    }, { status: 500 });
  }
} 