"use client";

import { useEffect, useState } from 'react';

export default function GoogleOAuthConfigPage() {
  const [redirectUri, setRedirectUri] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Get the current URL to determine the redirect URI
    const protocol = window.location.protocol;
    const host = window.location.host;
    const baseUrl = `${protocol}//${host}`;
    
    const uri = `${baseUrl}/api/auth/google/callback`;
    setRedirectUri(uri);
    setLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Google OAuth Configuration
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Use this information to set up your Google OAuth credentials
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Redirect URI</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add this exact URL to the "Authorized redirect URIs" section in your Google Cloud Console OAuth credentials.
              </p>
              {loaded ? (
                <div className="mt-2 bg-gray-100 p-3 rounded-md flex justify-between items-center">
                  <code className="text-sm text-gray-800 break-all">{redirectUri}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(redirectUri);
                      alert('Copied to clipboard!');
                    }}
                    className="ml-3 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Copy
                  </button>
                </div>
              ) : (
                <div className="animate-pulse mt-2 h-10 bg-gray-200 rounded-md"></div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900">Setup Instructions</h3>
              <ol className="mt-1 text-sm text-gray-500 list-decimal list-inside space-y-2">
                <li>Go to the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">Google Cloud Console</a></li>
                <li>Create or select a project</li>
                <li>Go to "Credentials" and click "Create Credentials" &gt; "OAuth client ID"</li>
                <li>Select "Web application" as the application type</li>
                <li>Add the redirect URI shown above to "Authorized redirect URIs"</li>
                <li>Copy the Client ID and Client Secret to your .env.local file</li>
              </ol>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Important: After updating your Google Cloud Console settings, you may need to wait a few minutes for changes to propagate.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 