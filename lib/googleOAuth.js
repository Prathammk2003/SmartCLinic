import { google } from 'googleapis';

// Get the base URL of the application
const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_API_URL || 'https://your-production-url.com';
  }
  // In development, use the PORT from .env.local
  const port = process.env.PORT || 3000;
  return `http://localhost:${port}`;
};

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${getBaseUrl()}/api/auth/google/callback` // Use dynamic callback URL
);

// Generate Google authentication URL
export function getGoogleAuthURL() {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
  });
}

// Get user information with the provided code
export async function getGoogleUser(code) {
  try {
    // Log the code for debugging
    console.log('Exchanging code for tokens');
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user profile info
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2',
    });

    console.log('Fetching user info from Google');
    const { data } = await oauth2.userinfo.get();
    console.log('Received user data from Google:', { email: data.email, id: data.id });
    
    return data;
  } catch (error) {
    console.error('Error getting Google user:', error);
    throw error;
  }
} 