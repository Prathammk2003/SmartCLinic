"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get("/api/users/me");
        if (response.data && response.data.success) {
          setUserData(response.data.data);
          
          // Role-based redirection
          if (response.data.data.role === "admin") {
            router.push("/admin/dashboard");
            return;
          } else if (response.data.data.role === "doctor") {
            router.push("/doctor/dashboard");
            return;
          }
        }
        
        try {
          // Fetch appointments for patient
          const appointmentsRes = await axios.get("/api/appointments/user");
          if (appointmentsRes.data && appointmentsRes.data.success) {
            setAppointments(appointmentsRes.data.data || []);
            console.log("Appointments loaded:", appointmentsRes.data.data?.length || 0);
          }
        } catch (appointmentErr) {
          console.error("Error fetching appointments:", appointmentErr);
          // Continue execution - don't let appointment errors block the whole dashboard
        }
        
        try {
          // Fetch prescriptions for patient
          const prescriptionsRes = await axios.get("/api/prescriptions/user");
          if (prescriptionsRes.data && prescriptionsRes.data.success) {
            setPrescriptions(prescriptionsRes.data.data || []);
            console.log("Prescriptions loaded:", prescriptionsRes.data.data?.length || 0);
          }
        } catch (prescriptionErr) {
          console.error("Error fetching prescriptions:", prescriptionErr);
          // Continue execution - don't let prescription errors block the whole dashboard
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        
        // If user is not found (404) or unauthorized (401), redirect to login
        if (err.response && (err.response.status === 404 || err.response.status === 401)) {
          console.log("User not found or not authenticated. Redirecting to login...");
          // Add a small delay before redirect to ensure message is shown
          setTimeout(() => {
            router.push("/auth/login");
          }, 1500);
          setError("You need to log in to access the dashboard.");
        } else {
          setError("Failed to load dashboard data. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-500">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {userData?.name}
          </p>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main content - 2/3 width on md screens and above */}
          <div className="md:col-span-2 space-y-6">
            {/* Upcoming Appointments */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Upcoming Appointments</h2>
                  <Link href="/appointments/book" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    Book New
                  </Link>
                </div>
                
                {appointments.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No upcoming appointments</p>
                    <Link href="/appointments/book" className="mt-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-500">
                      Book an appointment
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <div key={appointment._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {appointment.doctorId?.userId?.name || "Doctor"}
                            </h3>
                            <p className="text-sm text-gray-500">{appointment.doctorId?.specialization}</p>
                            {appointment.slotId && (
                              <p className="mt-2 text-sm text-gray-700">
                                {new Date(appointment.slotId.date).toLocaleDateString()} at {appointment.slotId.startTime}
                              </p>
                            )}
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            appointment.status === 'approved' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {appointment.status}
                          </span>
                        </div>
                        
                        <div className="mt-4 flex justify-end space-x-2">
                          <Link 
                            href={`/appointments/${appointment._id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-500"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Prescriptions */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Prescriptions</h2>
                
                {prescriptions.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No prescriptions available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {prescriptions.map((prescription) => (
                      <div key={prescription._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-gray-500">
                              Prescribed by: {prescription.doctorId?.userId?.name || "Doctor"}
                            </p>
                            <p className="mt-2 text-sm text-gray-700">
                              Date: {new Date(prescription.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex justify-end space-x-2">
                          <Link 
                            href={`/prescriptions/${prescription._id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-500"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - 1/3 width on md screens and above */}
          <div className="space-y-6">
            {/* User Profile Card */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Profile</h2>
                
                {userData && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-800 font-medium text-lg">
                          {userData.name?.charAt(0) || "U"}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{userData.name}</h3>
                        <p className="text-sm text-gray-500">{userData.email}</p>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <dl className="space-y-3">
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">Phone</dt>
                          <dd className="text-sm text-gray-900 col-span-2">{userData.phone || "Not provided"}</dd>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">Gender</dt>
                          <dd className="text-sm text-gray-900 col-span-2">{userData.gender || "Not provided"}</dd>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                          <dd className="text-sm text-gray-900 col-span-2">
                            {userData.dateOfBirth ? new Date(userData.dateOfBirth).toLocaleDateString() : "Not provided"}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <Link href="/profile" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                        Edit Profile
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                
                <ul className="space-y-3">
                  <li>
                    <Link 
                      href="/appointments/book" 
                      className="flex items-center text-blue-600 hover:text-blue-500"
                    >
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Book Appointment
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/medical-records" 
                      className="flex items-center text-blue-600 hover:text-blue-500"
                    >
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Medical Records
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/prescriptions" 
                      className="flex items-center text-blue-600 hover:text-blue-500"
                    >
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      View Prescriptions
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 