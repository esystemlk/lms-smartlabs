"use client";

import Link from "next/link";
import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function PaymentCancelPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center animate-in fade-in zoom-in duration-500">
      <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-red-200/50">
        <XCircle size={48} strokeWidth={2.5} />
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
        Payment Cancelled
      </h1>
      
      <p className="text-gray-600 dark:text-gray-300 max-w-md mb-8 text-lg">
        You have cancelled the payment process. No charges were made to your account.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        <Link href="/courses" className="w-full">
          <Button size="lg" fullWidth className="gap-2 shadow-lg shadow-blue-500/20">
            <ArrowLeft size={18} />
            Back to Courses
          </Button>
        </Link>
        <Link href="/dashboard" className="w-full">
          <Button variant="outline" size="lg" fullWidth>
            Go to Dashboard
          </Button>
        </Link>
      </div>
      
      <p className="mt-8 text-sm text-gray-500">
        If you experienced an error, please try again or contact support.
      </p>
    </div>
  );
}
