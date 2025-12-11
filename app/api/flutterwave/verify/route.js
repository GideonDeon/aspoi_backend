import axios from "axios";
import prisma from "@/lib/prisma";

const MEMBERSHIP_PRICES = {
  "Field Operational Membership": 37500,
  "Philantropic Membership": 225000,
  "Professional Membership Individual": 180000,
  "Corporate Membership": 750000,
};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const transaction_id = searchParams.get("transaction_id");
  const tx_ref = searchParams.get("tx_ref");
  const status = searchParams.get("status");

  try {
    const response = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        },
      }
    );

    const paymentData = response.data.data;
    
    const membership = paymentData.meta?.membership;
    const paidAmount = paymentData.amount;
    const expectedAmount = MEMBERSHIP_PRICES[membership];

    if (paidAmount !== expectedAmount) {
      console.error(
        `❌ Payment amount mismatch: expected ${expectedAmount}, got ${paidAmount}`
      );
      return new Response(
        JSON.stringify({ error: "Payment amount mismatch" }),
        { status: 400 }
      );
    }

    if (
      paymentData.status === "successful" &&
      paymentData.tx_ref === tx_ref &&
      paymentData.currency === "NGN"
    ) {
      await prisma.user.create({
        data: {
          fullname: paymentData.meta?.fullname,
          email: paymentData.meta?.email || paymentData.customer.email,
          phone: paymentData.meta?.phone,
          membership: membership,
          amount: paidAmount,
          imageUrl: paymentData.meta?.imageUrl,
          paymentStatus: "success",
          paymentReference: tx_ref,
          transactionId: transaction_id,
        },
      });
    }

    return new Response(
      JSON.stringify({
        status: "success",
        message: "Payment verified successfully",
        data: {
          status: paymentData.status,
          amount: paymentData.amount,
          currency: paymentData.currency,
          customer: {
            email: paymentData.meta?.email || paymentData.customer.email,
            name: paymentData.meta?.fullname,
            phonenumber: paymentData.meta?.phone,
          },
          meta: paymentData.meta,
          tx_ref: paymentData.tx_ref,
        },
      }),
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "https://www.aspoi.com",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    console.error("Verification error:", error.response?.data || error.message);
    return new Response(
      JSON.stringify({ 
        error: "Payment verification failed",
        details: error.response?.data 
      }),
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "https://www.aspoi.com",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}