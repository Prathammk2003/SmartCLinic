'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import Payment from '@/app/components/Payment';
import { toast } from 'react-hot-toast';

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingData, setBookingData] = useState(null);
  const [doctorData, setDoctorData] = useState(null);
  const [slotData, setSlotData] = useState(null);
  
  // Get data from URL parameters
  const doctorId = searchParams.get('doctorId');
  const slotId = searchParams.get('slotId');
  const appointmentType = searchParams.get('type');
  const appointmentReason = searchParams.get('reason');
  const appointmentSymptoms = searchParams.get('symptoms');
  const appointmentNotes = searchParams.get('notes');
  
  useEffect(() => {
    // Validate required parameters
    if (!doctorId || !slotId) {
      setError('Missing required booking information');
      setLoading(false);
      return;
    }
    
    // Create appointment details object
    const appointmentDetails = {
      type: appointmentType || 'Consultation',
      reason: appointmentReason || 'General checkup',
      symptoms: appointmentSymptoms || '',
      notes: appointmentNotes || ''
    };
    
    setBookingData({
      doctorId,
      slotId,
      appointmentDetails
    });
    
    // Fetch doctor details
    const fetchDoctorData = async () => {
      try {
        const response = await axios.get(`/api/doctors/${doctorId}`);
        setDoctorData(response.data.doctor);
      } catch (err) {
        console.error('Error fetching doctor data:', err);
        toast.error('Failed to load doctor information');
        setError('Could not load doctor information');
      }
    };
    
    // Fetch slot details
    const fetchSlotData = async () => {
      try {
        const response = await axios.get(`/api/slots/${slotId}`);
        setSlotData(response.data.slot);
      } catch (err) {
        console.error('Error fetching slot data:', err);
        toast.error('Failed to load appointment slot information');
        setError('Could not load appointment slot information');
      }
    };
    
    // Run both fetches in parallel
    Promise.all([fetchDoctorData(), fetchSlotData()])
      .finally(() => setLoading(false));
      
  }, [doctorId, slotId, appointmentType, appointmentReason, appointmentSymptoms, appointmentNotes]);
  
  const handleCancel = () => {
    router.back();
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        <span className="ml-3 text-lg">Loading payment information...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => router.push('/appointments/book')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Return to Booking
          </button>
        </div>
      </div>
    );
  }
  
  // Format date and time for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  const formatTime = (startTime, endTime) => {
    if (!startTime || !endTime) return 'Not available';
    return `${startTime} - ${endTime}`;
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      {bookingData && (
        <Payment
          doctorId={bookingData.doctorId}
          slotId={bookingData.slotId}
          appointmentDetails={bookingData.appointmentDetails}
          doctorName={doctorData?.name || 'Selected Doctor'}
          appointmentDate={formatDate(slotData?.date)}
          appointmentTime={formatTime(slotData?.startTime, slotData?.endTime)}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
} 