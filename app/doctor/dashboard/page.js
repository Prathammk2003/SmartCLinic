"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";

export default function DoctorDashboard() {
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [appointmentSlots, setAppointmentSlots] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // For new slot form
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [newSlot, setNewSlot] = useState({
    date: "",
    startTime: "",
    endTime: "",
    duration: 60, // In minutes - default to 60 minutes (1 hour)
    isAvailable: true,
    createHourlySlots: true // Default to creating hourly slots
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get doctor profile
        const profileResponse = await axios.get('/api/doctor/profile');
        if (profileResponse.data && profileResponse.data.success) {
          setDoctorProfile(profileResponse.data.data);
        }

        // Get doctor's appointment slots
        const slotsResponse = await axios.get('/api/doctor/slots');
        if (slotsResponse.data && slotsResponse.data.success) {
          setAppointmentSlots(slotsResponse.data.data);
        }

        // Get all appointments (no need for pending vs confirmed separation)
        const appointmentsResponse = await axios.get('/api/appointments', {
          params: { doctorId: profileResponse.data.data._id }
        });
        if (appointmentsResponse.data && appointmentsResponse.data.success) {
          setUpcomingAppointments(appointmentsResponse.data.data || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewSlot({
      ...newSlot,
      [name]: value
    });
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/doctor/slots', newSlot);
      if (response.data && response.data.success) {
        // Handle response data properly based on whether it's a single slot or multiple slots
        if (Array.isArray(response.data.data)) {
          // Multiple slots were created (hourly slots feature)
          setAppointmentSlots([...appointmentSlots, ...response.data.data]);
          console.log(`Added ${response.data.data.length} hourly slots`);
        } else {
          // Single slot was created
          setAppointmentSlots([...appointmentSlots, response.data.data]);
        }
        
        // Reset form
        setNewSlot({
          date: "",
          startTime: "",
          endTime: "",
          duration: 60,
          isAvailable: true,
          createHourlySlots: true
        });
        setShowSlotForm(false);
      }
    } catch (err) {
      console.error("Error creating slot:", err);
      setError("Failed to create time slot. Please try again.");
    }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      await axios.delete(`/api/doctor/slots/${slotId}`);
      // Remove slot from the list
      setAppointmentSlots(appointmentSlots.filter(slot => slot._id !== slotId));
    } catch (err) {
      console.error("Error deleting slot:", err);
      setError("Failed to delete time slot. Please try again.");
    }
  };

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, Dr. {doctorProfile?.userId?.name || 'Doctor'}
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

        <div className="grid grid-cols-1 gap-8">
          {/* Appointments */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Confirmed Appointments</h2>
            </div>
            <div className="px-6 py-5">
              {upcomingAppointments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No upcoming appointments</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {upcomingAppointments.map((appointment) => (
                    <li key={appointment._id} className="py-4">
                      <div className="flex flex-col sm:flex-row justify-between">
                        <div>
                          <h3 className="text-sm font-medium">{appointment.userId?.name || "Patient"}</h3>
                          <p className="text-sm text-gray-500">
                            {appointment.slotId ? new Date(appointment.slotId.date).toLocaleDateString() : "No date"} at {appointment.slotId?.startTime || "No time"}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            <span className="font-medium">Reason:</span> {appointment.reason}
                          </p>
                        </div>
                        <div className="mt-2 sm:mt-0 flex space-x-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {appointment.status || "Confirmed"}
                          </span>
                          {appointment.type === "video" && (
                            <button className="ml-2 text-sm text-blue-600 hover:text-blue-500">
                              Start Video Call
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Appointment Slots Management */}
        <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Available Time Slots</h2>
            <button
              onClick={() => setShowSlotForm(!showSlotForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              {showSlotForm ? "Cancel" : "Add Slot"}
            </button>
          </div>
          
          {showSlotForm && (
            <div className="px-6 py-5 bg-gray-50 border-b border-gray-200">
              <form onSubmit={handleAddSlot} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                      Date
                    </label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={newSlot.date}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
                    />
                  </div>
                  {!newSlot.createHourlySlots && (
                    <>
                      <div>
                        <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                          Start Time
                        </label>
                        <input
                          type="time"
                          id="startTime"
                          name="startTime"
                          value={newSlot.startTime}
                          onChange={handleChange}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
                        />
                      </div>
                      <div>
                        <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                          End Time
                        </label>
                        <input
                          type="time"
                          id="endTime"
                          name="endTime"
                          value={newSlot.endTime}
                          onChange={handleChange}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
                        />
                      </div>
                    </>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                      Appointment Duration (minutes)
                    </label>
                    <select
                      id="duration"
                      name="duration"
                      value={newSlot.duration}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
                      disabled={newSlot.createHourlySlots}
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">60 minutes</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center h-full pt-5">
                      <input
                        id="createHourlySlots"
                        name="createHourlySlots"
                        type="checkbox"
                        checked={newSlot.createHourlySlots}
                        onChange={(e) => {
                          setNewSlot({
                            ...newSlot,
                            createHourlySlots: e.target.checked,
                            duration: e.target.checked ? 60 : newSlot.duration,
                            // Set default times when hourly slots are enabled
                            startTime: e.target.checked ? "09:00" : newSlot.startTime,
                            endTime: e.target.checked ? "17:00" : newSlot.endTime,
                          });
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="createHourlySlots" className="ml-2 block text-sm text-gray-700">
                        Create slots at one-hour intervals automatically
                      </label>
                    </div>
                  </div>
                </div>
                {newSlot.createHourlySlots && (
                  <div className="bg-blue-50 p-4 rounded-md">
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">Auto-create hourly slots:</span> 9:00 AM to 5:00 PM
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      This will create 8 one-hour slots for the selected date.
                    </p>
                  </div>
                )}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Create Slot
                  </button>
                </div>
              </form>
            </div>
          )}
          
          <div className="px-6 py-5">
            {appointmentSlots.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No available time slots. Create some slots for patients to book.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
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
                    {appointmentSlots.map((slot, index) => {
                      // Debug log to check keys
                      console.log(`Slot ${index} key:`, slot._id);
                      return (
                        <tr key={slot._id || index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(slot.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {slot.startTime} - {slot.endTime}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {slot.duration || '--'} minutes
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {slot.isAvailable ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Available
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                Booked
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => handleDeleteSlot(slot._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 