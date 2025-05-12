'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { format } from 'date-fns';

export default function AppointmentDetails({ params }) {
  const router = useRouter();
  const { appointmentId } = params;
  
  const [appointment, setAppointment] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [slot, setSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch appointment
        const response = await axios.get(`/api/appointments/${appointmentId}`);
        
        if (response.data?.success) {
          const appointmentData = response.data.data;
          setAppointment(appointmentData);
          
          // Fetch doctor and slot details
          const [doctorRes, slotRes] = await Promise.all([
            axios.get(`/api/doctors/${appointmentData.doctorId}`),
            axios.get(`/api/slots/${appointmentData.slotId}`)
          ]);
          
          setDoctor(doctorRes.data.doctor);
          setSlot(slotRes.data.slot);
        } else {
          setError('Failed to load appointment details');
        }
      } catch (err) {
        console.error('Error fetching appointment details:', err);
        setError('Failed to load appointment details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId) {
      fetchAppointmentDetails();
    }
  }, [appointmentId]);
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    
    try {
      const date = new Date(dateString);
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
  
  const handleCancel = async () => {
    try {
      const response = await axios.patch(`/api/appointments/${appointmentId}`, {
        status: 'cancelled'
      });
      
      if (response.data?.success) {
        // Update the local state with the updated appointment
        setAppointment({
          ...appointment,
          status: 'cancelled'
        });
      } else {
        alert('Failed to cancel appointment');
      }
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      alert('Failed to cancel appointment');
    }
  };
  
  const handleReschedule = () => {
    router.push(`/appointments/reschedule?appointmentId=${appointmentId}`);
  };
  
  const handleBack = () => {
    router.push('/appointments');
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
            <span className="ml-3 text-lg text-gray-700">Loading appointment details...</span>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error || 'Appointment not found'}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Appointment Details</h1>
          <button 
            onClick={handleBack} 
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Appointments
          </button>
        </div>
        
        {/* Status badge */}
        <div className="mb-6">
          <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusBadgeClass(appointment.status)}`}>
            {appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1) || 'Unknown'}
          </span>
        </div>
        
        {/* Appointment details card */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6 bg-blue-50">
            <h2 className="text-lg leading-6 font-medium text-gray-900">Appointment Summary</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Details about your medical appointment.</p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Doctor</dt>
                <dd className="mt-1 text-sm text-gray-900">{doctor?.name || 'Unknown'}</dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Specialization</dt>
                <dd className="mt-1 text-sm text-gray-900">{doctor?.specialization || 'Not specified'}</dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Date</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(slot?.date)}</dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Time</dt>
                <dd className="mt-1 text-sm text-gray-900">{slot?.startTime || ''} - {slot?.endTime || ''}</dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{appointment.type || 'Not specified'}</dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Reason</dt>
                <dd className="mt-1 text-sm text-gray-900">{appointment.reason || 'Not specified'}</dd>
              </div>
              
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Symptoms</dt>
                <dd className="mt-1 text-sm text-gray-900">{appointment.symptoms || 'None specified'}</dd>
              </div>
              
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Notes</dt>
                <dd className="mt-1 text-sm text-gray-900">{appointment.notes || 'None'}</dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Payment Status</dt>
                <dd className="mt-1">
                  {appointment.paymentStatus === 'completed' ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Paid
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      {appointment.paymentStatus || 'Unpaid'}
                    </span>
                  )}
                </dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {appointment.paymentMethod === 'qrcode' ? 'QR Code Payment' : appointment.paymentMethod || 'Not specified'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-start space-x-4">
          {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
            <>
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Cancel Appointment
              </button>
              
              <button
                onClick={handleReschedule}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Reschedule
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 