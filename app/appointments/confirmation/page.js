"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";

export default function AppointmentConfirmation() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "confirmed";
  const appointmentId = searchParams.get("id");
  
  const [status, setStatus] = useState(initialStatus);
  const [lastChecked, setLastChecked] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Poll for status updates if appointment is pending and we have the ID
  useEffect(() => {
    // Status polling removed since appointments are now directly confirmed
    // We'll keep this effect for possible future expansion
    if (!appointmentId) return;
    
    // Just set the last checked time for display
    setLastChecked(new Date());
  }, [appointmentId, status]);

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-md">
        <div id="status-container" className="text-center transition-all duration-500">
          {status === "confirmed" || status === "approved" ? (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Appointment Confirmed!
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Your appointment has been successfully booked.
              </p>
            </>
          ) : status === "cancelled" ? (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                <svg
                  className="h-6 w-6 text-gray-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Appointment Cancelled
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                This appointment has been cancelled.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Appointment {status}
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                There was an issue with your appointment.
              </p>
            </>
          )}
          
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          {status === "confirmed" || status === "approved" ? (
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-900 mb-1">Next Steps:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>You will receive a confirmation email with all the details.</li>
                <li>Please arrive 15 minutes before your scheduled time.</li>
                <li>Bring any relevant medical records or test results.</li>
                <li>Prepare any questions you want to ask the doctor.</li>
              </ol>
            </div>
          ) : status === "cancelled" ? (
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-900 mb-1">What you can do:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Try scheduling at a different time or with a different doctor.</li>
                <li>Contact our support if you need assistance.</li>
                <li>Check your appointments dashboard for more information.</li>
              </ol>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-900 mb-1">What you can do:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Try scheduling at a different time or with a different doctor.</li>
                <li>Contact our support if you need assistance.</li>
                <li>Check your appointments dashboard for more information.</li>
              </ol>
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-3">
          <Link
            href="/appointments"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            View My Appointments
          </Link>
          
          {(status === "rejected" || status === "cancelled") && (
            <Link
              href="/appointments/book"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Book New Appointment
            </Link>
          )}
          
          <Link
            href="/"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 