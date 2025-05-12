import { NextResponse } from 'next/server';
import { getGoogleUser } from '@/lib/googleOAuth';
import connectToDB from '@/lib/mongoose';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    // Get the authorization code from the URL
    const url = new URL(request.url);
    
    // Log the full callback URL to help with debugging
    console.log('Callback URL:', request.url);
    
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    
    // Handle any errors returned from Google
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(error)}`, url.origin));
    }
    
    if (!code) {
      return NextResponse.redirect(new URL('/auth/login?error=No authorization code provided', url.origin));
    }
    
    // Get user info from Google
    const googleUser = await getGoogleUser(code);
    
    if (!googleUser || !googleUser.email) {
      return NextResponse.redirect(new URL('/auth/login?error=Failed to get user info from Google', url.origin));
    }
    
    await connectToDB();
    
    // Check if user already exists
    let user = await User.findOne({ 
      $or: [
        { email: googleUser.email },
        { googleId: googleUser.id }
      ]
    });
    
    // If user doesn't exist, create a new one
    if (!user) {
      user = await User.create({
        name: googleUser.name,
        email: googleUser.email,
        authMethod: 'google',
        googleId: googleUser.id,
        phone: 'Please update', // Required field, should be updated by user
        isVerified: true, // Google accounts are considered verified
        profilePicture: googleUser.picture || '',
      });
    } else if (!user.googleId) {
      // If user exists with email but no googleId, link the accounts
      user.googleId = googleUser.id;
      user.authMethod = 'google';
      user.isVerified = true;
      await user.save();
    }
    
    // Create token
    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    // Set token in cookies
    const cookieStore = await cookies();
    
    // Clear any existing token cookie
    cookieStore.delete("token");
    
    // Set the new token cookie
    cookieStore.set({
      name: "token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    // Store user role in localStorage
    const redirectUrl = user.role === 'admin' 
      ? '/admin/dashboard' 
      : user.role === 'doctor' 
        ? '/doctor/dashboard' 
        : '/dashboard';
    
    // If phone is 'Please update', redirect to profile page to update
    const finalRedirect = user.phone === 'Please update' 
      ? '/profile?newuser=true' 
      : redirectUrl;
    
    return NextResponse.redirect(new URL(finalRedirect, url.origin));
  } catch (error) {
    console.error('Error in Google callback route:', error);
    return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, request.url));
  }
} 