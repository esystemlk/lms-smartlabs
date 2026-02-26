"use client";

import { useEffect, useRef, useState } from 'react';
import { payhereService } from '@/services/payhereService';
import { settingsService } from '@/services/settingsService';

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
  const [effectiveSandbox, setEffectiveSandbox] = useState<boolean | null>(null);
  const [merchantId, setMerchantId] = useState<string>('');

  // Resolve mode and merchant id
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const s = await settingsService.getSettings();
        const isSandbox = sandbox !== undefined ? sandbox : (s.payhereMode !== 'live');
        if (!mounted) return;
        setEffectiveSandbox(isSandbox);
        const id = isSandbox 
          ? (process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID_SANDBOX || process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID || '')
          : (process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID_LIVE || process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID || '');
        setMerchantId(id);
      } catch {
        setEffectiveSandbox(sandbox);
        setMerchantId(process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID || '');
      }
    };
    init();
    return () => { mounted = false; };
  }, [sandbox]);

  // Start payment when ready
  useEffect(() => {
    if (initialized.current) return;
    if (effectiveSandbox === null || !merchantId) return;
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
          baseUrl,
          merchantId
        );

        const payment = {
          sandbox: effectiveSandbox,
          ...params,
          hash
        };

        if (window.payhere) {
          window.payhere.startPayment(payment);

          window.payhere.onCompleted = function onCompleted(orderId: string) {
            window.location.href = params.return_url;
          };

          window.payhere.onDismissed = function onDismissed() {
            onDismiss();
          };

          window.payhere.onError = function onError(error: string) {
            onError(error);
          };
        } else {
          onError("PayHere SDK not loaded. Please refresh and try again.");
        }
      } catch (error) {
        onError(error);
      }
    };

    startPayment();
  }, [orderId, items, amount, currency, userData, onDismiss, onError, effectiveSandbox, merchantId]);

  return null;
}
