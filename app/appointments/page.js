'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { format } from 'date-fns';

export default function MyAppointments() {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [doctorDetails, setDoctorDetails] = useState({});
  const [slotDetails, setSlotDetails] = useState({});

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/appointments');
        
        if (response.data?.success) {
          setAppointments(response.data.data || []);
          
          // Fetch doctor and slot details for each appointment
          const appointmentsData = response.data.data || [];
          await fetchRelatedData(appointmentsData);
        } else {
          setError('Failed to load appointments');
        }
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError('Failed to load appointments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const fetchRelatedData = async (appointmentsData) => {
    const doctorIds = [...new Set(appointmentsData.map(app => app.doctorId))];
    const slotIds = [...new Set(appointmentsData.map(app => app.slotId))];
    
    const doctorPromises = doctorIds.map(id => 
      axios.get(`/api/doctors/${id}`)
        .then(res => [id, res.data.doctor])
        .catch(err => {
          console.error(`Error fetching doctor ${id}:`, err);
          return [id, { name: 'Unknown Doctor' }];
        })
    );
    
    const slotPromises = slotIds.map(id => 
      axios.get(`/api/slots/${id}`)
        .then(res => [id, res.data.slot])
        .catch(err => {
          console.error(`Error fetching slot ${id}:`, err);
          return [id, { date: new Date(), startTime: 'Unknown', endTime: 'Unknown' }];
        })
    );
    
    try {
      const doctorResults = await Promise.all(doctorPromises);
      const slotResults = await Promise.all(slotPromises);
      
      const doctorMap = Object.fromEntries(doctorResults);
      const slotMap = Object.fromEntries(slotResults);
      
      setDoctorDetails(doctorMap);
      setSlotDetails(slotMap);
    } catch (err) {
      console.error('Error fetching related data:', err);
    }
  };

  const formatAppointmentDate = (slotData) => {
    if (!slotData || !slotData.date) return 'Date not available';
    
    try {
      const date = new Date(slotData.date);
      return format(date, 'PPPP'); // e.g., "Monday, January 1, 2023"
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Invalid date';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewDetails = (appointmentId) => {
    router.push(`/appointments/${appointmentId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">My Appointments</h1>
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
            <span className="ml-3 text-lg text-gray-700">Loading appointments...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">My Appointments</h1>
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
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
          <button 
            onClick={() => router.push('/dashboard')} 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Appointments</h1>
        
        {appointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-8 text-center">
              <p className="text-lg text-gray-500 mb-4">You don't have any appointments yet.</p>
              <button
                onClick={() => router.push('/appointments/book')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Book an Appointment
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map((appointment) => {
                    const doctor = doctorDetails[appointment.doctorId] || {};
                    const slot = slotDetails[appointment.slotId] || {};
                    
                    return (
                      <tr key={appointment._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{doctor.name || 'Unknown Doctor'}</div>
                          <div className="text-sm text-gray-500">{doctor.specialization || ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatAppointmentDate(slot)}</div>
                          <div className="text-sm text-gray-500">{slot.startTime || ''} - {slot.endTime || ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{appointment.type || 'Consultation'}</div>
                          <div className="text-sm text-gray-500">{appointment.reason || ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(appointment.status)}`}>
                            {appointment.status || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {appointment.paymentStatus === 'completed' ? (
                            <span className="text-green-600">Paid</span>
                          ) : (
                            <span className="text-red-600">Unpaid</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleViewDetails(appointment._id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 