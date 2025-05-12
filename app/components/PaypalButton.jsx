'use client';

import { useState } from 'react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const PaypalButton = ({ 
  doctorId, 
  slotId, 
  appointmentDetails, 
  amount,
  onSuccess,
  onError 
}) => {
  const router = useRouter();
  const [orderId, setOrderId] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [{ isPending }] = usePayPalScriptReducer();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Create order with our backend
  const createOrder = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Call our API to create an order
      const response = await axios.post('/api/payment/paypal', {
        doctorId,
        slotId,
        appointmentDetails,
        amount: Number(amount)
      });
      
      // Store data we'll need for capture
      setOrderId(response.data.orderId);
      setPaymentData(response.data.paymentData);
      
      console.log('Order created successfully:', response.data);
      
      // Return a temporary order ID 
      // In a real app, you'd integrate with PayPal's create order API
      return response.data.orderId;
    } catch (err) {
      console.error('Failed to create order:', err);
      setError(err.response?.data?.error || 'Failed to create order');
      setIsProcessing(false);
      if (onError) {
        onError(err);
      }
      throw err; // Ensure error is propagated to PayPal component
    }
  };

  // Capture payment after approval
  const onApprove = async (data) => {
    try {
      setIsProcessing(true);
      
      // Call our API to capture the payment and create appointment
      const response = await axios.put('/api/payment/paypal', {
        paymentId: data.paymentID || data.orderID,
        orderId: orderId,
        paymentData: paymentData
      });
      
      setIsProcessing(false);
      
      // Handle success
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      // Redirect to confirmation page
      if (response.data.appointmentId) {
        router.push(`/appointments/confirmation?appointmentId=${response.data.appointmentId}`);
      }
    } catch (err) {
      console.error('Payment capture failed:', err);
      setError(err.response?.data?.error || 'Payment failed to process');
      setIsProcessing(false);
      if (onError) {
        onError(err);
      }
    }
  };

  // Handle errors during payment flow
  const onPayPalError = (err) => {
    console.error('PayPal error:', err);
    setError('PayPal payment failed. Please try again.');
    setIsProcessing(false);
    if (onError) {
      onError(err);
    }
  };

  if (error) {
    return (
      <div className="my-4 p-4 bg-red-100 text-red-800 rounded-md">
        <p className="font-medium">Payment Error</p>
        <p>{error}</p>
        <button 
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          onClick={() => setError(null)}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {isPending || isProcessing ? (
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
          
          <PayPalButtons
            style={{
              layout: 'vertical',
              color: 'blue',
              shape: 'rect',
              label: 'pay'
            }}
            createOrder={createOrder}
            onApprove={onApprove}
            onError={onPayPalError}
            onCancel={() => {
              setError('Payment was cancelled. Please try again.');
              if (onError) {
                onError({ message: 'Payment cancelled' });
              }
            }}
          />
          
          <p className="text-sm text-gray-500 mt-4 text-center">
            By proceeding with the payment, you agree to our terms and conditions.
          </p>
        </>
      )}
    </div>
  );
};

export default PaypalButton; 