export default function handler(req, res) {
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  const baseUrl = `${protocol}://${host}`;
  
  const redirectUri = `${baseUrl}/api/auth/google/callback`;
  
  res.status(200).json({
    message: 'Use this exact URL in your Google Cloud Console',
    redirectUri,
    instructions: 'Copy the redirectUri value above and add it to your Google OAuth client credentials in the Google Cloud Console.'
  });
} 