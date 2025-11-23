"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    if (reference) {
      fetch(`/api/paystack/verify?reference=${reference}`)
        .then((res) => res.json())
        .then((data) => setPaymentData(data.data));
    }
  }, [reference]);

  if (!paymentData) return <p>Verifying payment...</p>;

  return (
    <div>
      <h1>Payment Successful 🎉</h1>
      <p>Fullname: {paymentData.metadata.fullname}</p>
      <p>Email: {paymentData.customer.email}</p>
      <p>Phone: {paymentData.metadata.phone}</p>
      <p>Membership: {paymentData.metadata.membership}</p>
      <p>Amount Paid: ₦{paymentData.amount / 100}</p>
    </div>
  );
}
