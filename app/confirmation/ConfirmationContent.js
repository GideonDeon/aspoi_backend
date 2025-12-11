"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import jsPDF from "jspdf";

export default function ConfirmationContent() {
  const searchParams = useSearchParams();
  const transaction_id = searchParams.get("transaction_id");
  const tx_ref = searchParams.get("tx_ref");
  const status = searchParams.get("status");

  const [paymentData, setPaymentData] = useState(
    status === "cancelled" ? { status: "cancelled", tx_ref } : null
  );
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === "cancelled") return;

    if (transaction_id && tx_ref) {
      fetch(
        `/api/flutterwave/verify?transaction_id=${transaction_id}&tx_ref=${tx_ref}&status=${status}`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else {
            setPaymentData(data.data);
          }
        })
        .catch(() => setError("Failed to verify payment"));
    }
  }, [transaction_id, tx_ref, status]);

  if (error) return <p style={{ color: "red" }}>❌ {error}</p>;
  if (!paymentData) return <p className="mt-5 ml-5">Verifying payment...</p>;

  const paymentStatus = paymentData.status;

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    try {
      doc.addImage("/images/aspoi-logo.png", "PNG", 20, 10, 20, 20);
    } catch {
      // Logo not found, skipping...
    }

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Membership Payment Receipt", 105, 25, { align: "center" });

    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    doc.text(`Fullname: ${paymentData.customer?.name || "N/A"}`, 20, 50);
    doc.text(`Email: ${paymentData.customer?.email || "N/A"}`, 20, 60);
    doc.text(`Phone: ${paymentData.customer?.phonenumber || "N/A"}`, 20, 70);
    doc.text(`Membership: ${paymentData.meta?.membership || "N/A"}`, 20, 80);
    doc.text(
      `Amount Paid: NGN${paymentData.amount?.toLocaleString() || "0"}`,
      20,
      90
    );
    doc.text(`Payment Status: ${paymentData.status}`, 20, 100);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 110);
    doc.text(`Reference: ${tx_ref}`, 20, 120);

    doc.setFontSize(10);
    doc.setTextColor(128);
    doc.text("Thank you for your membership!", 105, 140, { align: "center" });

    doc.save(`receipt_${paymentData.customer?.name || tx_ref}.pdf`);
  };

  if (paymentStatus === "successful") {
    return (
      <div
        className="pl-1 pr-1 h-fit w-full mb-10 shadow-2xl sm:w-120 
                  sm:relative sm:left-[50%] sm:-translate-x-[50%] lg:w-140 font-roboto"
      >
        <h1 className="italic text-center font-roboto mt-2 mb-3 pl-1 pr-1">
          Thank you for completing your membership registration. We are excited
          to have you with us!
        </h1>
        <div className="grid grid-cols-[1fr_2fr] pl-1 pr-1 mb-10 sm:pl-8 lg:pl-15">
          <Image
            src={paymentData.meta?.imageUrl || "/images/placeholder.png"}
            alt="User uploaded"
            width={100}
            height={100}
            className="w-30 h-30 border-2 border-black rounded-[15px] ml-1 sm:ml-0"
          />
          <div className="pt-6 text-[15px]">
            <p className="mb-2">Fullname: {paymentData.customer?.name}</p>
            <p>Membership: {paymentData.meta?.membership}</p>
          </div>
        </div>
        <div className="grid grid-cols-[1fr_1fr] w-full text-[15px] gap-1 sm:grid-cols-[2fr_1fr] pl-5">
          <p>Email: {paymentData.customer?.email}</p>
          <p>
            Phone:{" "}
            {paymentData.customer?.phonenumber || paymentData.meta?.phone}
          </p>
          <p>
            Payment Status: <span className="text-green-500">Successful!</span>
          </p>
          <p>Amount Paid: ₦{paymentData.amount?.toLocaleString()}</p>
        </div>
        <p className="text-center text-[12px] italic mt-5">
          Please visit the members page for more details.
        </p>
        <p className="text-center mt-2 text-blue-500">
          <a href="https://www.aspoi.com/members">Check Membership</a>
        </p>
        <button
          onClick={handleDownloadPDF}
          className="bg-black text-white hover:bg-[#feff00] hover:text-black uppercase cursor-pointer rounded-[10px] w-full h-10 transition-all delay-100 mt-12"
        >
          Download Receipt (PDF)
        </button>
      </div>
    );
  }

  if (paymentStatus === "cancelled") {
    return (
      <div>
        <h1 className="text-gray-500 text-center pt-10 text-[20px]">Payment Cancelled 🚫</h1>
        <p className="text-center">You cancelled the payment process.</p>
        <p className="text-center">
          No charges were made. If you wish, you can try again.
        </p>
        <p className="text-center mt-2 text-blue-500">
          <a href="https://www.aspoi.com/register">Retry Payment</a>
        </p>
      </div>
    );
  }

  if (paymentStatus === "failed") {
    return (
      <div>
        <h1 className="text-red-500 text-center">Payment Failed ❌</h1>
        <p className="text-center">
          Unfortunately, your payment could not be processed.
        </p>
        <p className="text-center">Please try again or contact support.</p>
      </div>
    );
  }

  if (paymentStatus === "pending") {
    return (
      <div>
        <h1 className="text-orange-400 text-center">Payment Pending ⏳</h1>
        <p className="text-center">Your payment is still being confirmed.</p>
        <p className="text-center">
          Please refresh this page in a few minutes.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-center">Unknown Payment Status 🤔</h1>
      <p className="text-center">
        Please contact support with your reference: {tx_ref}
      </p>
    </div>
  );
}
