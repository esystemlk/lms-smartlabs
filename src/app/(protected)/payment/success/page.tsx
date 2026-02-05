"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { enrollmentService } from "@/services/enrollmentService";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id"); // This is the enrollment ID
  
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const confirmPayment = async () => {
      if (!orderId) {
        setError("Invalid Order ID");
        setLoading(false);
        return;
      }

      try {
        // We attempt to approve the enrollment.
        // Note: This relies on Firestore rules allowing the user to update their own enrollment 
        // and related batch counters. If this fails, the user is instructed to contact support.
        await enrollmentService.approveEnrollment(orderId);
        
        setSuccess(true);
      } catch (err) {
        console.error("Payment confirmation failed", err);
        // It's possible the enrollment was already approved by the webhook
        // or the user doesn't have permission to update batch counts directly.
        // In a production app, the webhook (server-to-server) is the source of truth.
        // We'll show a generic error but the webhook might have succeeded.
        setError("We couldn't automatically verify your enrollment update, but your payment was likely successful. Please check your dashboard.");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      confirmPayment();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-green-500 animate-spin mb-4" />
        <h2 className="text-xl font-semibold">Verifying Payment...</h2>
        <p className="text-gray-500">Please wait while we confirm your enrollment.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      {success ? (
        <>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Enrollment Successful!</h1>
          <p className="text-gray-600 mb-8 max-w-md">
            Thank you for your payment. You now have full access to the course materials.
          </p>
          <div className="flex gap-4">
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
            <Link href="/courses">
              <Button variant="outline">Browse More Courses</Button>
            </Link>
          </div>
        </>
      ) : (
        <>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Status Update</h1>
          <p className="text-gray-600 mb-8 max-w-md">
            {error}
          </p>
          <div className="flex gap-4">
            <Link href="/dashboard">
              <Button>Check Dashboard</Button>
            </Link>
            <Link href="/support">
              <Button variant="outline">Contact Support</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
