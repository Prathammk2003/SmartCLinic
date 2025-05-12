'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const QRCodePayment = ({ 
  doctorId, 
  slotId, 
  appointmentDetails, 
  amount,
  onSuccess,
  onError 
}) => {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const [error, setError] = useState(null);
  
  // Sample QR code placeholder - in a real app, this would be dynamically generated
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=payment_${doctorId}_${slotId}_${amount}_${Date.now()}`;
  
  // Create a payment intent on component mount
  useEffect(() => {
    createPaymentIntent();
  }, []);
  
  const createPaymentIntent = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Call our API to create a payment intent
      const response = await axios.post('/api/payment/qrcode', {
        doctorId,
        slotId,
        appointmentDetails,
        amount: Number(amount)
      });
      
      // Store payment ID for confirmation
      setPaymentId(response.data.paymentId);
      setIsProcessing(false);
      
      // In a real app, we would poll for payment status here
      
    } catch (err) {
      console.error('Failed to create payment intent:', err);
      setError(err.response?.data?.error || 'Failed to initialize payment');
      setIsProcessing(false);
      if (onError) {
        onError(err);
      }
    }
  };
  
  // Mock function to simulate payment confirmation
  // In a real app, this would poll a backend API to check payment status
  const confirmPayment = async () => {
    try {
      setIsProcessing(true);
      
      // Simulate API call to confirm payment
      const response = await axios.put('/api/payment/qrcode', {
        paymentId,
        doctorId,
        slotId,
        appointmentDetails,
        amount: Number(amount)
      });
      
      setPaymentSuccess(true);
      setIsProcessing(false);
      
      // Handle success
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      // Check if this was already booked before
      if (response.data.alreadyBooked) {
        router.push(`/appointments/${response.data.appointmentId}`);
        return;
      }
      
      // Redirect to confirmation page
      if (response.data.appointmentId) {
        router.push(`/appointments/confirmation?appointmentId=${response.data.appointmentId}`);
      }
    } catch (err) {
      console.error('Payment confirmation failed:', err);
      
      // Special handling for already booked slots
      if (err.response?.status === 409) {
        setError('This appointment slot has already been booked by another patient. Please select a different slot.');
      } else {
        setError(err.response?.data?.error || 'Payment verification failed');
      }
      
      setIsProcessing(false);
      if (onError) {
        onError(err);
      }
    }
  };
  
  if (error) {
    return (
      <div className="my-4 p-4 bg-red-100 text-red-800 rounded-md">
        <p className="font-medium">Payment Error</p>
        <p>{error}</p>
        <button 
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          onClick={() => createPaymentIntent()}
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-md mx-auto">
      {isProcessing ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          <span className="ml-2">Processing payment...</span>
        </div>
      ) : (
        <>
          <div className="bg-gray-100 p-4 mb-4 rounded-md">
            <p className="text-lg font-medium">Payment Summary</p>
            <p className="text-gray-700">Appointment fee: ₹{amount}</p>
          </div>
          
          <div className="flex flex-col items-center justify-center p-6 border rounded-md">
            <p className="mb-4 text-center font-medium">
              Scan this QR code to complete your payment
            </p>
            
            <div className="relative w-52 h-52 mb-4">
              <Image
                src={qrCodeUrl}
                alt="Payment QR Code"
                fill
                sizes="(max-width: 768px) 100vw, 200px"
                className="object-contain"
              />
            </div>
            
            <p className="text-sm text-gray-500 mb-4 text-center">
              After scanning and completing the payment on your device, click the button below.
            </p>
            
            {/* In a real app, this button would check payment status automatically */}
            <button
              className="w-full py-3 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
              onClick={confirmPayment}
            >
              I've Completed Payment
            </button>
          </div>
          
          <p className="text-sm text-gray-500 mt-4 text-center">
            By proceeding with the payment, you agree to our terms and conditions.
          </p>
        </>
      )}
    </div>
  );
};

export default QRCodePayment; 