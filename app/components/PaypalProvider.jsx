'use client';

import { PayPalScriptProvider } from '@paypal/react-paypal-js';

const PaypalProvider = ({ children }) => {
  // Initial options for PayPal script
  const initialOptions = {
    // Use a proper sandbox client ID - you'll need to replace this with your actual PayPal sandbox client ID
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewfBP4-8aqX3PiV8e1GWU6liB2CUXlkA59kJXE7M6R',
    currency: 'INR',
    intent: 'capture',
    components: 'buttons',
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      {children}
    </PayPalScriptProvider>
  );
};

export default PaypalProvider; 