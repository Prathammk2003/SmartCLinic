# Smart Clinic Appointment Booking System

A modern web application for scheduling medical appointments online with integrated SMS reminders and payment processing.

## Features

- 👨‍⚕️ Browse and search for doctors by specialization
- 📅 Book, reschedule, and cancel appointments
- 💳 Multiple payment options (PayPal and QR code)
- 📱 SMS reminders (24-hour, 12-hour, and 1-hour before appointments)
- 👤 User authentication and profile management
- 📊 Patient dashboard with appointment history
- 🔔 Automated reminders system
- 📝 Medical history tracking
- 🖥️ Admin dashboard for managing doctors, slots, and appointments
- 📱 Responsive design for mobile and desktop

## Technology Stack

- **Frontend**: Next.js 15, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT-based authentication
- **SMS Notifications**: Twilio API
- **Payment Processing**: PayPal integration and QR code payments
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- MongoDB (local or Atlas)
- Twilio account (for SMS notifications)
- PayPal developer account (for payment processing)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/smart_appointment_booking_system.git
   cd smart_appointment_booking_system
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   # Database
   MONGODB_URI=your_mongodb_connection_string
   
   # JWT Authentication
   JWT_SECRET=your_secure_secret_key
   
   # Twilio (for SMS)
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   
   # PayPal
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
   
   # API Settings
   REMINDER_API_KEY=your_reminder_api_key
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

4. Run the development server
   ```
   npm run dev
   ```

5. Open [http://localhost:3001](http://localhost:3001) in your browser

## Project Structure

```
/app
  /admin           # Admin dashboard and management
  /api             # API routes
  /appointments    # Appointment booking and management
  /auth            # Authentication pages
  /components      # Reusable UI components
  /profile         # User profile management
/lib
  /models          # MongoDB models
  /twilio.js       # Twilio integration for SMS
  /mongoose.js     # Database connection
/scripts
  /appointment-reminders.js  # Standalone reminder script
  /send-reminders.js         # Reminder service
/public            # Static assets
```

## Key Features Explained

### SMS Reminders
The system sends automated appointment reminders at three intervals:
- 24 hours before the appointment
- 12 hours before the appointment
- 1 hour before the appointment

### Payment Options
Two payment methods are supported:
- PayPal integration for international payments
- QR code-based payments for local/mobile payments

### Appointment Management
- Patients can book, view, reschedule, and cancel appointments
- Doctors can manage their availability through time slots
- Admin can oversee all appointments and user accounts

## Running the Reminder Service

To set up the appointment reminder service:

1. Run the standalone script manually:
   ```
   node scripts/appointment-reminders.js
   ```

2. For production, set up cron jobs:
   ```
   # Run day-before reminders at 6 PM daily
   0 18 * * * /path/to/node /path/to/appointment-reminders.js
   
   # Run hourly checks for 12-hour and 1-hour reminders
   0 * * * * /path/to/node /path/to/appointment-reminders.js
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- This project was created for a hackathon
- Icons and illustrations are from various open-source libraries
