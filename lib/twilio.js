import twilio from 'twilio';

// Initialize the Twilio client with credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '';

// Create a Twilio client only if credentials are available
let client;
let isTwilioConfigured = false;

if (accountSid && authToken && twilioPhoneNumber) {
  try {
    client = twilio(accountSid, authToken);
    isTwilioConfigured = true;
    console.log('Twilio client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Twilio client:', error);
  }
} else {
  console.warn('Twilio not fully configured. SMS notifications will be simulated.');
  console.warn('To enable real SMS, set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env.local');
  console.warn('Make sure to use a phone number purchased in your Twilio account.');
}

/**
 * Send an SMS message using Twilio
 * @param {string} to - Recipient phone number (must include country code)
 * @param {string} body - Message content
 * @returns {Promise} - Resolves with message info or rejects with error
 */
export async function sendSMS(to, body) {
  try {
    // Format phone number to ensure it has the country code
    const formattedNumber = formatPhoneNumber(to);
    
    // Check if Twilio is configured
    if (!isTwilioConfigured) {
      console.log('SIMULATED SMS to:', formattedNumber);
      console.log('Message:', body);
      return { 
        success: true, 
        simulated: true,
        messageSid: 'SIMULATED_' + Date.now() 
      };
    }
    
    // Send the message
    const message = await client.messages.create({
      body,
      from: twilioPhoneNumber,
      to: formattedNumber
    });

    console.log(`SMS sent successfully! SID: ${message.sid}`);
    return { success: true, messageSid: message.sid };
  } catch (error) {
    console.error('Error sending SMS:', error);
    
    // Special handling for common Twilio errors
    if (error.code === 21659) {
      console.error('The phone number used is not a valid Twilio number for your account. Please check your Twilio phone number configuration.');
    } else if (error.code === 21211) {
      console.error('Invalid "To" phone number format. Please check the recipient\'s phone number.');
    }
    
    return { 
      success: false, 
      error: error.message,
      code: error.code,
      simulated: false
    };
  }
}

/**
 * Format a phone number to ensure it has a country code
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} - Formatted phone number with country code
 */
function formatPhoneNumber(phoneNumber) {
  // Remove any non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // If the number doesn't start with a +, add the country code
  if (!phoneNumber.startsWith('+')) {
    // Assuming India (+91) as default country code if not specified
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    // For numbers that might already have country code but no +
    return `+${cleaned}`;
  }
  
  return phoneNumber;
}

/**
 * Send an appointment confirmation SMS
 * @param {Object} appointment - The appointment object
 * @param {Object} userDetails - User details including phone
 * @param {Object} doctorDetails - Doctor details
 * @returns {Promise} - Result of the SMS sending operation
 */
export async function sendAppointmentConfirmation(appointment, userDetails, doctorDetails) {
  const { date, startTime, type } = appointment;
  const formattedDate = new Date(date).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const message = `
Your appointment with Dr. ${doctorDetails.name} has been confirmed!
Date: ${formattedDate}
Time: ${startTime}
Type: ${type}
Thank you for using our service.
`;

  return sendSMS(userDetails.phone, message);
}

/**
 * Send an appointment reminder SMS
 * @param {Object} appointment - The appointment object
 * @param {Object} userDetails - User details including phone
 * @param {Object} doctorDetails - Doctor details
 * @param {String} customMessage - Optional custom message for the reminder
 * @returns {Promise} - Result of the SMS sending operation
 */
export async function sendAppointmentReminder(appointment, userDetails, doctorDetails, customMessage) {
  if (customMessage) {
    return sendSMS(userDetails.phone, customMessage);
  }
  
  const { date, startTime, type } = appointment;
  const formattedDate = new Date(date).toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const message = `
REMINDER: Your appointment with Dr. ${doctorDetails.name} is tomorrow!
Date: ${formattedDate}
Time: ${startTime}
Type: ${type}
Location: Medical Center, First Floor
Please arrive 15 minutes early. Reply CANCEL if you need to reschedule.
`;

  return sendSMS(userDetails.phone, message);
} 