#!/usr/bin/env node

/**
 * This script sends appointment reminders for appointments at different time intervals.
 * It should be run at regular intervals (e.g., every hour):
 * 
 * To set up as cron jobs:
 * 1. Make sure the script is executable: chmod +x scripts/send-reminders.js
 * 2. Add to crontab:
 *    - For daily reminders: 0 18 * * * /path/to/project/scripts/send-reminders.js day-before
 *    - For hourly checks: 0 * * * * /path/to/project/scripts/send-reminders.js hourly
 * 
 * When run with the 'hourly' parameter, it will automatically check for both 12-hour and 1-hour reminders.
 */

const http = require('http');
const https = require('https');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Development server typically runs on port 3001
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const REMINDER_API_KEY = process.env.REMINDER_API_KEY;

// Server port (change this if your dev server is on a different port)
const SERVER_PORT = 3001;

if (!REMINDER_API_KEY) {
  console.error('Error: REMINDER_API_KEY not found in environment variables.');
  process.exit(1);
}

// Get reminder type from command line arguments or default to day-before
const reminderType = process.argv[2] || 'day-before';

// If 'hourly' is specified, run both 12-hour and 1-hour checks
const reminderTypes = reminderType === 'hourly' 
  ? ['12-hour', '1-hour'] 
  : [reminderType];

console.log(`Starting appointment reminder service for: ${reminderTypes.join(', ')}...`);

// Process each reminder type sequentially
async function processReminders() {
  for (const type of reminderTypes) {
    try {
      await sendReminder(type);
    } catch (error) {
      console.error(`Error processing ${type} reminders:`, error);
    }
  }
}

function sendReminder(type) {
  return new Promise((resolve, reject) => {
    console.log(`Sending ${type} reminders...`);
    
    // Prepare request data
    const data = JSON.stringify({
      key: REMINDER_API_KEY,
      reminderType: type
    });
    
    // Parse URL
    const apiUrl = new URL(`${API_URL}/api/reminders`);
    const useHttps = apiUrl.protocol === 'https:';
    
    // Force IPv4 for localhost connections
    let hostname = apiUrl.hostname;
    if (hostname === 'localhost') {
      hostname = '127.0.0.1';
    }
    
    const options = {
      hostname: hostname,
      port: SERVER_PORT, // Using explicit port
      path: apiUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    // Send the request using the appropriate protocol
    const requestModule = useHttps ? https : http;
    const req = requestModule.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          
          if (res.statusCode === 200) {
            console.log(`Success (${type}): ${response.message}`);
            if (response.results) {
              console.log(`Successfully sent: ${response.successCount}/${response.count} ${type} reminders`);
            }
            resolve(response);
          } else {
            console.error(`Error (${type}): ${response.error || 'Unknown error'}`);
            reject(new Error(response.error || 'Unknown error'));
          }
        } catch (e) {
          console.error(`Error parsing response for ${type}:`, e);
          console.error('Raw response:', responseData);
          reject(e);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`Error sending ${type} reminder request:`, error);
      reject(error);
    });
    
    // Send the request
    req.write(data);
    req.end();
  });
}

// Execute the reminders
processReminders()
  .then(() => {
    console.log('All reminder requests completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error in reminder process:', error);
    process.exit(1);
  }); 