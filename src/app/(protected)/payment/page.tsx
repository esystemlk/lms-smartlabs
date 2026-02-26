 "use client";
 
 import { useEffect } from "react";
 import { useRouter } from "next/navigation";
 import Link from "next/link";
 import { Button } from "@/components/ui/Button";
 import { CreditCard } from "lucide-react";
 
 export default function PaymentIndexPage() {
   const router = useRouter();
 
   useEffect(() => {
     const t = setTimeout(() => {
       router.replace("/courses");
     }, 1500);
     return () => clearTimeout(t);
   }, [router]);
 
   return (
     <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
       <div className="w-20 h-20 bg-blue-100 text-brand-blue rounded-full flex items-center justify-center mb-6">
         <CreditCard size={36} />
       </div>
       <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Portal</h1>
       <p className="text-gray-600 mb-6 max-w-md">
         Redirecting you back to Courses. If you completed a payment, you will see your enrollment updated shortly.
       </p>
       <Link href="/courses">
         <Button>Go to Courses</Button>
       </Link>
     </div>
   );
 }
