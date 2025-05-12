'use client';

import { useState } from 'react';
import QRCodePayment from './QRCodePayment';
import { useRouter } from 'next/navigation';

const Payment = ({ 
  doctorId, 
  slotId, 
  appointmentDetails,
  doctorName,
  appointmentDate,
  appointmentTime,
  onCancel 
}) => {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // Set a default appointment fee - in a real app, this would come from the doctor's profile
  const appointmentFee = 50;
  
  const handlePaymentSuccess = (data) => {
    setPaymentSuccess(true);
    setIsProcessing(false);
    // Redirect is handled in the QR code payment component
  };
  
  const handlePaymentError = (error) => {
    setIsProcessing(false);
    console.error('Payment error:', error);
    // Error UI is handled in the QR code payment component
  };
  
  const handleCancel = () => {
    if (onCancel && typeof onCancel === 'function') {
      onCancel();
    } else {
      router.back();
    }
  };
  
  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Payment</h2>
      
      <div className="mb-6 border-b pb-4">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Appointment Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Doctor</p>
            <p className="font-medium">{doctorName || 'Selected Doctor'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Date & Time</p>
            <p className="font-medium">
              {appointmentDate || 'Selected Date'}, {appointmentTime || 'Selected Time'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Type</p>
            <p className="font-medium">{appointmentDetails?.type || 'Consultation'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Reason</p>
            <p className="font-medium">{appointmentDetails?.reason || 'General checkup'}</p>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Payment Method</h3>
        <p className="mb-4">Please complete your payment to confirm your appointment.</p>
        
        <QRCodePayment
          doctorId={doctorId}
          slotId={slotId}
          appointmentDetails={appointmentDetails}
          amount={appointmentFee}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      </div>
      
      <div className="flex justify-between mt-8">
        <button 
          onClick={handleCancel}
          disabled={isProcessing || paymentSuccess}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default Payment; 