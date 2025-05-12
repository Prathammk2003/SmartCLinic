import { NextResponse } from 'next/server';
import { getGoogleAuthURL } from '@/lib/googleOAuth';

export async function GET(request) {
  try {
    // Get the origin for constructing proper redirect URIs
    const url = new URL(request.url);
    console.log('Google auth request from origin:', url.origin);
    
    // Generate Google authentication URL
    const authUrl = getGoogleAuthURL();
    console.log('Generated Google auth URL:', authUrl);
    
    return NextResponse.json({ url: authUrl }, { status: 200 });
  } catch (error) {
    console.error('Error in Google auth route:', error);
    return NextResponse.json(
      { success: false, message: 'Google authentication failed', error: error.message },
      { status: 500 }
    );
  }
} 