"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    pendingAppointments: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch dashboard statistics
        const [usersResponse, doctorsResponse, appointmentsResponse] = await Promise.all([
          axios.get('/api/admin/users'),
          axios.get('/api/admin/doctors'),
          axios.get('/api/admin/appointments')
        ]);

        if (usersResponse.data && usersResponse.data.success) {
          setUsers(usersResponse.data.data);
          setStats(prev => ({ ...prev, totalUsers: usersResponse.data.data.length }));
        }

        if (doctorsResponse.data && doctorsResponse.data.success) {
          setDoctors(doctorsResponse.data.data);
          setStats(prev => ({ ...prev, totalDoctors: doctorsResponse.data.data.length }));
        }

        if (appointmentsResponse.data && appointmentsResponse.data.success) {
          setAppointments(appointmentsResponse.data.data);
          setStats(prev => ({ 
            ...prev, 
            totalAppointments: appointmentsResponse.data.data.length,
            pendingAppointments: appointmentsResponse.data.data.filter(a => a.status === 'pending').length
          }));
        }
      } catch (err) {
        console.error("Error fetching admin data:", err);
        setError("Failed to load admin dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUserStatusChange = async (userId, isActive) => {
    try {
      await axios.patch(`/api/admin/users/${userId}`, { isActive });
      setUsers(users.map(user => 
        user._id === userId ? { ...user, isActive } : user
      ));
    } catch (err) {
      console.error("Error updating user status:", err);
      setError("Failed to update user status. Please try again.");
    }
  };

  const handleDoctorVerification = async (doctorId, isVerified) => {
    try {
      await axios.patch(`/api/admin/doctors/${doctorId}`, { isVerified });
      setDoctors(doctors.map(doctor => 
        doctor._id === doctorId ? { ...doctor, isVerified } : doctor
      ));
    } catch (err) {
      console.error("Error updating doctor verification:", err);
      setError("Failed to update doctor verification status. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-500">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage users, doctors, and appointments
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Doctors</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDoctors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mr-4">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAppointments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center mr-4">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingAppointments}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-6 py-3 border-b-2 text-sm font-medium ${
                  activeTab === "overview"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`px-6 py-3 border-b-2 text-sm font-medium ${
                  activeTab === "users"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab("doctors")}
                className={`px-6 py-3 border-b-2 text-sm font-medium ${
                  activeTab === "doctors"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Doctors
              </button>
              <button
                onClick={() => setActiveTab("appointments")}
                className={`px-6 py-3 border-b-2 text-sm font-medium ${
                  activeTab === "appointments"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Appointments
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">System Overview</h2>
                <p className="text-gray-600 mb-4">
                  Welcome to the admin dashboard. Here you can manage all aspects of the Smart Clinic system.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Recent Activity</h3>
                    <ul className="space-y-3">
                      {appointments.slice(0, 5).map((appointment) => (
                        <li key={appointment._id} className="text-sm">
                          <div className="flex justify-between">
                            <span>
                              Appointment {appointment._id.substr(0, 8)}...
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              appointment.status === 'approved' ? 'bg-green-100 text-green-800' :
                              appointment.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {appointment.status}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Quick Actions</h3>
                    <div className="space-y-2">
                      <Link
                        href="/admin/users/create"
                        className="block text-sm text-blue-600 hover:text-blue-500"
                      >
                        + Add new user
                      </Link>
                      <Link
                        href="/admin/doctors/create"
                        className="block text-sm text-blue-600 hover:text-blue-500"
                      >
                        + Add new doctor
                      </Link>
                      <Link
                        href="/admin/settings"
                        className="block text-sm text-blue-600 hover:text-blue-500"
                      >
                        System settings
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">User Management</h2>
                  <Link
                    href="/admin/users/create"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Add User
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-600 font-medium">
                                  {user.name.charAt(0)}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'doctor' ? 'bg-green-100 text-green-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleUserStatusChange(user._id, !user.isActive)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <Link
                              href={`/admin/users/${user._id}`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Doctors Tab */}
            {activeTab === "doctors" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Doctor Management</h2>
                  <Link
                    href="/admin/doctors/create"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Add Doctor
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Specialization
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Experience
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Verification
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {doctors.map((doctor) => (
                        <tr key={doctor._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-600 font-medium">
                                  {doctor.userId?.name?.charAt(0) || "D"}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{doctor.userId?.name || "Doctor"}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{doctor.specialization}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{doctor.experience} years</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              doctor.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {doctor.isVerified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleDoctorVerification(doctor._id, !doctor.isVerified)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              {doctor.isVerified ? 'Unverify' : 'Verify'}
                            </button>
                            <Link
                              href={`/admin/doctors/${doctor._id}`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Appointments Tab */}
            {activeTab === "appointments" && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Appointment Management</h2>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Patient
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Doctor
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {appointments.map((appointment) => (
                        <tr key={appointment._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {appointment.userId?.name || "Patient"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {appointment.doctorId?.userId?.name || "Doctor"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {appointment.doctorId?.specialization}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {appointment.slotId ? (
                              <div className="text-sm text-gray-900">
                                {new Date(appointment.slotId.date).toLocaleDateString()} 
                                <span className="ml-1 text-gray-500">
                                  {appointment.slotId.startTime}
                                </span>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500">Not available</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              appointment.status === 'approved' ? 'bg-green-100 text-green-800' :
                              appointment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {appointment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              href={`/admin/appointments/${appointment._id}`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 