import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongoose";
import Appointment from "@/lib/models/Appointment";
import AppointmentSlot from "@/lib/models/AppointmentSlot";
import mongoose from "mongoose";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// GET a specific appointment
export async function GET(request, context) {
  try {
    await connectToDB();
    
    // Await params before destructuring
    const { appointmentId } = await context.params;
    
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid appointment ID format" 
      }, { status: 400 });
    }
    
    const appointment = await Appointment.findById(appointmentId)
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      })
      .populate('slotId')
      .populate('userId', 'name email phone');
    
    if (!appointment) {
      return NextResponse.json({ 
        success: false, 
        message: "Appointment not found" 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: appointment 
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to fetch appointment",
      error: error.message
    }, { status: 500 });
  }
}

// UPDATE an appointment status
export async function PATCH(request, context) {
  try {
    await connectToDB();
    
    // Await params before destructuring
    const { appointmentId } = await context.params;
    const { status } = await request.json();
    
    // Validate appointment ID
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid appointment ID format" 
      }, { status: 400 });
    }
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'rescheduled'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid status. Must be one of: " + validStatuses.join(', ') 
      }, { status: 400 });
    }
    
    // Get the user from token
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("token");
    
    if (!tokenCookie) {
      return NextResponse.json({ 
        success: false, 
        message: "Unauthorized - please log in" 
      }, { status: 401 });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(tokenCookie.value, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid authentication token" 
      }, { status: 401 });
    }
    
    // Find the appointment
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return NextResponse.json({ 
        success: false, 
        message: "Appointment not found" 
      }, { status: 404 });
    }
    
    // Check authorization - user must be the patient or the doctor
    const isPatient = appointment.userId.toString() === decoded.userId;
    const isDoctor = appointment.doctorId.toString() === decoded.userId;
    
    if (!isPatient && !isDoctor && decoded.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        message: "You are not authorized to update this appointment" 
      }, { status: 403 });
    }
    
    // Update appointment status
    appointment.status = status;
    
    // If cancelled, make the slot available again
    if (status === 'cancelled') {
      await AppointmentSlot.findByIdAndUpdate(
        appointment.slotId,
        { isAvailable: true, appointmentId: null }
      );
    }
    
    await appointment.save();
    
    return NextResponse.json({ 
      success: true, 
      message: `Appointment status updated to ${status}`,
      data: appointment 
    }, { status: 200 });
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to update appointment",
      error: error.message
    }, { status: 500 });
  }
}

// DELETE an appointment
export async function DELETE(request, context) {
  try {
    await connectToDB();
    
    // Await params before destructuring
    const { appointmentId } = await context.params;
    
    // Validate appointment ID
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid appointment ID format" 
      }, { status: 400 });
    }
    
    // Get the user from token
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("token");
    
    if (!tokenCookie) {
      return NextResponse.json({ 
        success: false, 
        message: "Unauthorized - please log in" 
      }, { status: 401 });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(tokenCookie.value, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid authentication token" 
      }, { status: 401 });
    }
    
    // Find the appointment
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return NextResponse.json({ 
        success: false, 
        message: "Appointment not found" 
      }, { status: 404 });
    }
    
    // Check authorization - only admin can delete appointments
    // Patients and doctors should cancel instead of delete
    if (decoded.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        message: "Only administrators can delete appointments" 
      }, { status: 403 });
    }
    
    // Make the slot available again
    await AppointmentSlot.findByIdAndUpdate(
      appointment.slotId,
      { isAvailable: true, appointmentId: null }
    );
    
    // Delete the appointment
    await Appointment.findByIdAndDelete(appointmentId);
    
    return NextResponse.json({ 
      success: true, 
      message: "Appointment deleted successfully" 
    }, { status: 200 });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to delete appointment",
      error: error.message
    }, { status: 500 });
  }
} 