import { NextResponse } from 'next/server';
import connectToDB from '@/lib/mongoose';
import User from '@/lib/models/User';
import Doctor from '@/lib/models/Doctor';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    console.log("Starting user registration...");
    const body = await request.json();
    const { 
      name, 
      email, 
      phone, 
      password, 
      gender, 
      dateOfBirth, 
      userType,
      // Doctor-specific fields
      specialization,
      qualifications,
      experience,
      licenseNumber,
      consultationFee,
      bio
    } = body;

    console.log("Registration data received:", { 
      name, email, phone, userType,
      hasSpecialization: !!specialization,
      hasConsultationFee: !!consultationFee
    });

    // Validate required fields
    if (!name || !email || !phone || !password || !userType) {
      console.log("Missing required fields");
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate doctor-specific fields
    if (userType === 'doctor' && (!specialization || !consultationFee)) {
      console.log("Missing doctor-specific fields");
      return NextResponse.json(
        { success: false, message: 'Missing required doctor information' },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectToDB();

    // Check if user already exists
    console.log("Checking if user exists with email:", email);
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log("User already exists with email:", email);
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    console.log("Creating new user with role:", userType);
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      gender,
      dateOfBirth,
      role: userType // 'patient' or 'doctor'
    });
    
    console.log("User created with ID:", user._id);

    // If registering as a doctor, create doctor profile
    let doctorData = null;
    if (userType === 'doctor') {
      // Parse qualifications string into array if provided
      const qualificationsArray = qualifications
        ? qualifications.split(',').map(q => q.trim())
        : [];
      
      console.log("Creating doctor profile for user:", user._id);
      doctorData = await Doctor.create({
        userId: user._id,
        specialization,
        qualifications: qualificationsArray,
        experience: experience ? parseInt(experience) : 0,
        licenseNumber: licenseNumber || '',
        consultationFee: parseFloat(consultationFee) || 0,
        bio: bio || '',
        education: 'Not specified' // Adding required field
      });
      
      console.log("Doctor profile created with ID:", doctorData._id);
    }

    // Create token for automatic login
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set token in cookies
    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Remove password from response
    const userWithoutPassword = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth
    };

    console.log("Registration successful for:", email);
    return NextResponse.json(
      {
        success: true,
        message: `${userType === 'doctor' ? 'Doctor' : 'Patient'} registered successfully`,
        data: {
          user: userWithoutPassword,
          doctorProfile: doctorData
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Registration failed', 
        error: error.message 
      },
      { status: 500 }
    );
  }
} 