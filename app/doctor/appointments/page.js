"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function DoctorAppointments() {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [processingId, setProcessingId] = useState(null);

  // Fetch doctor's appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        // In a real app, we would get the doctorId from the session
        const doctorId = "doctor123"; // Replace with actual doctor ID from auth
        
        const response = await axios.get(`/api/appointments?doctorId=${doctorId}`);
        if (response.data && response.data.success) {
          setAppointments(response.data.data);
        } else {
          setError("Failed to load appointments");
        }
      } catch (err) {
        console.error("Error fetching appointments:", err);
        setError("Failed to load appointments. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
    
    // Set up auto-refresh every 30 seconds
    const refreshInterval = setInterval(fetchAppointments, 30000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Filter appointments based on selected tab
  const filteredAppointments = appointments.filter(appointment => {
    if (activeTab === "pending") return appointment.status === "pending";
    if (activeTab === "approved") return appointment.status === "approved";
    if (activeTab === "completed") return appointment.status === "completed";
    if (activeTab === "rejected") return appointment.status === "rejected" || appointment.status === "cancelled";
    return true;
  });

  // Handle appointment action (approve/reject)
  const handleAppointmentAction = async (appointmentId, action) => {
    setProcessingId(appointmentId);
    try {
      // Show toast notification for the action
      const toastId = toast.loading(
        `${action === 'approved' ? 'Approving' : 'Rejecting'} appointment...`
      );
      
      const response = await axios.patch(`/api/appointments/${appointmentId}`, {
        status: action,
        notes: doctorNotes
      });
      
      if (response.data && response.data.success) {
        // Update the local state
        setAppointments(prev => 
          prev.map(apt => 
            apt._id === appointmentId 
              ? { ...apt, status: action } 
              : apt
          )
        );
        setCurrentAppointment(null);
        setDoctorNotes("");
        
        // Show success toast
        toast.success(`Appointment ${action} successfully`, {
          id: toastId,
        });
      } else {
        toast.error(`Failed to ${action} appointment`, {
          id: toastId,
        });
        setError("Failed to update appointment");
      }
    } catch (err) {
      console.error(`Error ${action} appointment:`, err);
      toast.error(`Failed to ${action} appointment`);
      setError(`Failed to ${action} appointment. Please try again.`);
    } finally {
      setProcessingId(null);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="ml-2 text-gray-700">Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Manage Appointments</h1>
      
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
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
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex -mb-px">
          <button
            className={`py-3 px-4 text-sm font-medium ${
              activeTab === "pending"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setActiveTab("pending")}
          >
            Pending
            <span className="ml-2 py-0.5 px-2 bg-yellow-100 text-yellow-800 rounded-full text-xs">
              {appointments.filter(a => a.status === "pending").length}
            </span>
          </button>
          
          <button
            className={`py-3 px-4 text-sm font-medium ${
              activeTab === "approved"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setActiveTab("approved")}
          >
            Approved
          </button>
          
          <button
            className={`py-3 px-4 text-sm font-medium ${
              activeTab === "completed"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setActiveTab("completed")}
          >
            Completed
          </button>
          
          <button
            className={`py-3 px-4 text-sm font-medium ${
              activeTab === "rejected"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setActiveTab("rejected")}
          >
            Rejected/Cancelled
          </button>
        </div>
      </div>
      
      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No {activeTab} appointments found.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredAppointments.map((appointment) => (
              <li key={appointment._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-600 font-medium">
                            {appointment.userId?.name?.charAt(0) || "P"}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {appointment.userId?.name || "Patient"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.userId?.email || "No email provided"}
                        </div>
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          appointment.status === 'approved' ? 'bg-green-100 text-green-800' : 
                          appointment.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                          'bg-red-100 text-red-800'}`}
                      >
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <div className="mr-6 flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        {appointment.slotId ? formatDate(appointment.slotId.date) : "No date"}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        {appointment.slotId ? `${appointment.slotId.startTime} - ${appointment.slotId.endTime}` : "No time"}
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                      </svg>
                      {appointment.type.charAt(0).toUpperCase() + appointment.type.slice(1)}
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Reason:</span> {appointment.reason}
                    </p>
                    {appointment.symptoms.length > 0 && (
                      <p className="text-sm text-gray-700 mt-1">
                        <span className="font-medium">Symptoms:</span> {appointment.symptoms.join(", ")}
                      </p>
                    )}
                  </div>
                  
                  {appointment.status === "pending" && (
                    <div className="mt-4 flex justify-end space-x-3">
                      <button
                        onClick={() => setCurrentAppointment(appointment)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Review
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Review Modal */}
      {currentAppointment && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-lg w-full mx-4 overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900">Appointment Review</h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Patient</h4>
                  <p className="mt-1 text-sm text-gray-900">{currentAppointment.userId?.name || "Patient"}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Date & Time</h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {currentAppointment.slotId ? (
                      `${formatDate(currentAppointment.slotId.date)} at ${currentAppointment.slotId.startTime} - ${currentAppointment.slotId.endTime}`
                    ) : (
                      "No date/time information"
                    )}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Reason for visit</h4>
                  <p className="mt-1 text-sm text-gray-900">{currentAppointment.reason}</p>
                </div>
                
                {currentAppointment.symptoms.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Symptoms</h4>
                    <p className="mt-1 text-sm text-gray-900">{currentAppointment.symptoms.join(", ")}</p>
                  </div>
                )}
                
                {currentAppointment.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Additional Notes</h4>
                    <p className="mt-1 text-sm text-gray-900">{currentAppointment.notes}</p>
                  </div>
                )}
                
                <div>
                  <label htmlFor="doctorNotes" className="block text-sm font-medium text-gray-700">
                    Your Notes (optional)
                  </label>
                  <textarea
                    id="doctorNotes"
                    name="doctorNotes"
                    rows={3}
                    className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add any notes about this appointment"
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                  ></textarea>
                </div>
              </div>
            </div>
            <div className="px-4 py-4 sm:px-6 bg-gray-50 flex justify-end space-x-3">
              <button
                type="button"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                onClick={() => handleAppointmentAction(currentAppointment._id, "rejected")}
                disabled={processingId === currentAppointment._id}
              >
                {processingId === currentAppointment._id ? "Rejecting..." : "Reject"}
              </button>
              <button
                type="button"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                onClick={() => handleAppointmentAction(currentAppointment._id, "approved")}
                disabled={processingId === currentAppointment._id}
              >
                {processingId === currentAppointment._id ? "Approving..." : "Approve"}
              </button>
              <button
                type="button"
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => {
                  setCurrentAppointment(null);
                  setDoctorNotes("");
                }}
                disabled={processingId === currentAppointment._id}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 