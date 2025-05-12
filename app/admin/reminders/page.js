'use client';

import { useState } from 'react';
import axios from 'axios';

export default function AppointmentReminders() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [reminderType, setReminderType] = useState('day-before');

  const runReminders = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await axios.post('/api/reminders', {
        key: process.env.NEXT_PUBLIC_REMINDER_API_KEY,
        reminderType
      });
      
      setResult(response.data);
    } catch (err) {
      console.error('Error triggering reminders:', err);
      setError(err.response?.data?.error || 'Failed to trigger reminders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Appointment Reminder System</h1>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
            <h2 className="text-xl font-semibold text-blue-800">How Reminders Work</h2>
          </div>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Automatic Reminders</h3>
            <p className="mb-4 text-gray-700">
              The system automatically sends SMS reminders to patients for their upcoming appointments. 
              Reminders are sent in three situations:
            </p>
            
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li>
                <strong>Day-Before Reminders:</strong> Sent 24 hours before the scheduled appointment.
              </li>
              <li>
                <strong>12-Hour Reminders:</strong> Sent 12 hours before the scheduled appointment.
              </li>
              <li>
                <strong>1-Hour Reminders:</strong> Sent 1 hour before the scheduled appointment time.
              </li>
              <li>
                <strong>Confirmation Reminders:</strong> Sent immediately after an appointment is booked and payment is confirmed.
              </li>
            </ul>
            
            <h3 className="text-lg font-medium text-gray-900 mb-3">Setting Up Scheduled Reminders</h3>
            <p className="mb-4 text-gray-700">
              For automatic reminders to work, you need to set up scheduled tasks (cron jobs) that run at specific intervals.
              We've provided a script that can be configured for different reminder types.
            </p>
            
            <div className="bg-gray-50 rounded-md p-4 mb-6 font-mono text-sm overflow-x-auto">
              <code>
                {`# Run the day-before reminder script at 6:00 PM every day
0 18 * * * /path/to/your/app/scripts/send-reminders.js day-before

# Run hourly checks for 12-hour and 1-hour reminders
0 * * * * /path/to/your/app/scripts/send-reminders.js hourly`}
              </code>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 mb-3">Required Environment Variables</h3>
            <p className="mb-4 text-gray-700">
              Make sure the following variables are set in your .env.local file:
            </p>
            
            <div className="bg-gray-50 rounded-md p-4 mb-6 font-mono text-sm overflow-x-auto">
              <code>
                {`# Twilio credentials
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX  # Must be a number purchased in your Twilio account!

# Reminder API security
REMINDER_API_KEY=your_secret_api_key

# Base URL for API calls from scripts
NEXT_PUBLIC_API_URL=http://your-app-url.com`}
              </code>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 mb-3">Twilio Setup Instructions</h3>
            <ol className="list-decimal pl-6 mb-6 text-gray-700 space-y-2">
              <li>Create a <a href="https://www.twilio.com/try-twilio" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Twilio account</a> if you don't have one.</li>
              <li>Purchase a phone number from the Twilio console that supports SMS.</li>
              <li>Copy your Account SID and Auth Token from the Twilio dashboard.</li>
              <li>Add these values to your .env.local file.</li>
              <li>Make sure the phone number is entered in E.164 format (e.g., +1XXXXXXXXXX).</li>
            </ol>
            
            <div className="bg-yellow-50 p-4 rounded-md mb-6">
              <p className="text-yellow-800">
                <strong>Note:</strong> If Twilio is not configured, the system will simulate SMS sending (visible in console logs only).
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-4 bg-green-50 border-b border-green-100">
            <h2 className="text-xl font-semibold text-green-800">Test Reminders</h2>
          </div>
          <div className="p-6">
            <p className="mb-4 text-gray-700">
              You can manually trigger the reminder system to send messages for appointments using the options below.
              This is useful for testing or if the automated system fails.
            </p>
            
            <div className="mb-4">
              <label htmlFor="reminderType" className="block text-sm font-medium text-gray-700 mb-1">
                Reminder Type
              </label>
              <div className="max-w-md">
                <select
                  id="reminderType"
                  value={reminderType}
                  onChange={(e) => setReminderType(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="day-before">Day Before (24 hours)</option>
                  <option value="12-hour">12 Hours Before</option>
                  <option value="1-hour">1 Hour Before</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  {reminderType === 'day-before' && "Sends reminders for appointments scheduled for tomorrow."}
                  {reminderType === '12-hour' && "Sends reminders for appointments happening in approximately 12 hours."}
                  {reminderType === '1-hour' && "Sends urgent reminders for appointments happening in the next hour."}
                </p>
              </div>
            </div>
            
            <button
              onClick={runReminders}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {loading ? 'Sending Reminders...' : `Send ${reminderType === 'day-before' ? 'Day-Before' : reminderType === '12-hour' ? '12-Hour' : '1-Hour'} Reminders`}
            </button>
            
            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
                <p className="font-medium">Error:</p>
                <p>{error}</p>
              </div>
            )}
            
            {result && (
              <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md">
                <p className="font-medium">Result:</p>
                <p>{result.message}</p>
                {result.count > 0 && (
                  <p className="mt-2">
                    Successfully sent {result.successCount} out of {result.count} reminders.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-100">
            <h2 className="text-xl font-semibold text-yellow-800">Troubleshooting</h2>
          </div>
          <div className="p-6">
            <ul className="space-y-4 text-gray-700">
              <li>
                <strong>Reminders not sending:</strong> Check your Twilio credentials and ensure your account has sufficient balance.
              </li>
              <li>
                <strong>Missing patient phone numbers:</strong> Encourage patients to add their phone numbers in their profile settings.
              </li>
              <li>
                <strong>Script not running:</strong> Make sure the reminder script is executable and the path in your cron job is correct.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 