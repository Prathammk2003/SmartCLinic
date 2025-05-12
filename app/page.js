import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Smart Clinic Appointment Booking</h1>
            <p className="text-xl mb-8 max-w-2xl">
              Schedule your medical appointments online with ease. No more waiting on the phone or in long queues.
            </p>
            <div className="flex gap-4 flex-col sm:flex-row">
              <Link 
                href="/appointments/book" 
                className="bg-white text-blue-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Book an Appointment
              </Link>
              <Link 
                href="/auth/login" 
                className="bg-transparent border border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors"
              >
                Login / Register
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Why Choose Our Booking System</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-blue-600 text-2xl mb-4">⏱️</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Save Time</h3>
            <p className="text-gray-700">Book appointments 24/7 from anywhere without waiting on the phone.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-blue-600 text-2xl mb-4">📅</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Manage Appointments</h3>
            <p className="text-gray-700">Easily reschedule or cancel appointments as needed.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-blue-600 text-2xl mb-4">🔔</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Reminders</h3>
            <p className="text-gray-700">Receive timely notifications so you never miss an appointment.</p>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-4">1</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Create an Account</h3>
              <p className="text-gray-700">Sign up with your email or phone number.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-4">2</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Select a Doctor</h3>
              <p className="text-gray-700">Browse our specialists and choose your preferred doctor.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-4">3</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Book Your Slot</h3>
              <p className="text-gray-700">Select a convenient date and time for your appointment.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
