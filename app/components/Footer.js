import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">SmartClinic</h3>
            <p className="text-gray-300 mb-4">
              Making healthcare accessible and convenient for everyone.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-medium mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/appointments/book" className="text-gray-300 hover:text-white">
                  Book Appointment
                </Link>
              </li>
              <li>
                <Link href="/appointments" className="text-gray-300 hover:text-white">
                  My Appointments
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-gray-300 hover:text-white">
                  Profile
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-medium mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-gray-300 hover:text-white">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-medium mb-4">Contact</h4>
            <address className="not-italic text-gray-300">
              <p>123 Medical Avenue</p>
              <p>Healthville, HC 12345</p>
              <p className="mt-2">Email: info@smartclinic.com</p>
              <p>Phone: (123) 456-7890</p>
            </address>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-6 text-center">
          <p>&copy; {new Date().getFullYear()} SmartClinic Appointment System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 