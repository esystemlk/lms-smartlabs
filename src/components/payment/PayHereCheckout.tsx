"use client";

import { useEffect, useRef } from 'react';
import { payhereService } from '@/services/payhereService';

declare global {
  interface Window {
    payhere: any;
  }
}

interface PayHereCheckoutProps {
  orderId: string;
  items: string;
  amount: number;
  currency: string;
  userData: any;
  onDismiss: () => void;
  onError: (error: any) => void;
  sandbox?: boolean;
}

export function PayHereCheckout({ 
  orderId, 
  items, 
  amount, 
  currency, 
  userData,
  onDismiss,
  onError,
  sandbox = true
}: PayHereCheckoutProps) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const startPayment = async () => {
      try {
        const hash = await payhereService.generateHash(orderId, amount, currency);
        const baseUrl = window.location.origin;
        const params = payhereService.getCheckoutParams(
            orderId, 
            items, 
            amount, 
            currency, 
            userData, 
            baseUrl
        );

        const payment = {
          sandbox: sandbox,
          ...params,
          hash: hash
        };

        // Check if PayHere SDK is loaded
        if (window.payhere) {
            window.payhere.startPayment(payment);
            
            window.payhere.onCompleted = function onCompleted(orderId: string) {
                console.log("Payment completed. OrderID:" + orderId);
                // Redirect to success page manually if popup doesn't auto-redirect
                window.location.href = params.return_url;
            };

            window.payhere.onDismissed = function onDismissed() {
                onDismiss();
            };

            window.payhere.onError = function onError(error: string) {
                console.log("Error:" + error);
                onError(error);
            };
        } else {
            console.error("PayHere SDK not loaded");
            onError("PayHere SDK not loaded. Please refresh and try again.");
        }

      } catch (error) {
        console.error("Payment init failed", error);
        onError(error);
      }
    };

    startPayment();
  }, [orderId, items, amount, currency, userData, onDismiss, onError, sandbox]);

  return null; // Logic only component
}
