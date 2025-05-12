"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // On real app this would be replaced with actual auth check
  useEffect(() => {
    // Check if user is logged in and get their role
    // This is a mock implementation - in a real app, you'd use your auth system
    const checkUserSession = async () => {
      try {
        // Mock implementation - replace with actual auth check
        const role = localStorage.getItem('userRole');
        if (role) {
          setUserRole(role);
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
          setUserRole(null);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        setIsLoggedIn(false);
      }
    };
    
    checkUserSession();
  }, [pathname]);
  
  const handleLogout = () => {
    // Mock implementation - replace with actual logout logic
    localStorage.removeItem('userRole');
    setIsLoggedIn(false);
    setUserRole(null);
    router.push('/auth/login');
  };
  
  // Determine if we're on a doctor or admin page
  const isDoctorSection = pathname?.startsWith('/doctor');
  const isAdminSection = pathname?.startsWith('/admin');

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and site name */}
          <div className="flex items-center">
            <Link href="/" className="text-blue-700 font-bold text-xl flex items-center">
              <span className="text-2xl mr-2">💉</span>
              SmartClinic
              {isDoctorSection && (
                <span className="ml-2 text-sm text-gray-500 font-normal">(Doctor Portal)</span>
              )}
              {isAdminSection && (
                <span className="ml-2 text-sm text-gray-500 font-normal">(Admin Portal)</span>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-4">
            {/* Common Links */}
            <Link href="/" className="text-gray-700 hover:text-blue-700 px-3 py-2">
              Home
            </Link>
            
            {/* Guest/Patient Links */}
            {(!userRole || userRole === 'patient') && (
              <>
                <Link href="/appointments/book" className="text-gray-700 hover:text-blue-700 px-3 py-2">
                  Book Appointment
                </Link>
                {isLoggedIn && (
                  <>
                    <Link href="/appointments" className="text-gray-700 hover:text-blue-700 px-3 py-2">
                      My Appointments
                    </Link>
                    <Link href="/profile" className="text-gray-700 hover:text-blue-700 px-3 py-2">
                      Profile
                    </Link>
                  </>
                )}
              </>
            )}
            
            {/* Doctor Links */}
            {userRole === 'doctor' && (
              <>
                <Link href="/doctor/dashboard" className="text-gray-700 hover:text-blue-700 px-3 py-2">
                  Dashboard
                </Link>
                <Link href="/doctor/appointments" className="text-gray-700 hover:text-blue-700 px-3 py-2">
                  Appointments
                </Link>
                <Link href="/doctor/slots" className="text-gray-700 hover:text-blue-700 px-3 py-2">
                  Time Slots
                </Link>
                <Link href="/doctor/profile" className="text-gray-700 hover:text-blue-700 px-3 py-2">
                  Profile (₹)
                </Link>
              </>
            )}
            
            {/* Admin Links */}
            {userRole === 'admin' && (
              <>
                <Link href="/admin/dashboard" className="text-gray-700 hover:text-blue-700 px-3 py-2">
                  Dashboard
                </Link>
                <Link href="/admin/users" className="text-gray-700 hover:text-blue-700 px-3 py-2">
                  Users
                </Link>
                <Link href="/admin/doctors" className="text-gray-700 hover:text-blue-700 px-3 py-2">
                  Doctors (₹)
                </Link>
                <Link href="/admin/settings" className="text-gray-700 hover:text-blue-700 px-3 py-2">
                  Settings
                </Link>
              </>
            )}
          </div>

          {/* Auth Buttons (Desktop) */}
          <div className="hidden md:flex items-center space-x-2">
            {isLoggedIn ? (
              <>
                <span className="text-sm text-gray-600 mr-2">
                  {userRole === 'doctor' ? 'Doctor' : userRole === 'admin' ? 'Admin' : 'Patient'}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-gray-700 hover:text-blue-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-gray-700 hover:text-blue-700"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-700 focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-2 pb-4">
            <Link
              href="/"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            
            {/* Guest/Patient Links */}
            {(!userRole || userRole === 'patient') && (
              <>
                <Link
                  href="/appointments/book"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Book Appointment
                </Link>
                {isLoggedIn && (
                  <>
                    <Link
                      href="/appointments"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Appointments
                    </Link>
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile
                    </Link>
                  </>
                )}
              </>
            )}
            
            {/* Doctor Links */}
            {userRole === 'doctor' && (
              <>
                <Link
                  href="/doctor/dashboard"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/doctor/appointments"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Appointments
                </Link>
                <Link
                  href="/doctor/slots"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Time Slots
                </Link>
                <Link
                  href="/doctor/profile"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile (₹)
                </Link>
              </>
            )}
            
            {/* Admin Links */}
            {userRole === 'admin' && (
              <>
                <Link
                  href="/admin/dashboard"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/users"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Users
                </Link>
                <Link
                  href="/admin/doctors"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Doctors (₹)
                </Link>
                <Link
                  href="/admin/settings"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Settings
                </Link>
              </>
            )}
            
            <div className="mt-2 pt-2 border-t border-gray-200">
              {isLoggedIn ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
} 