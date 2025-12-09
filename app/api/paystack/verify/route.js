import axios from "axios";
import prisma from "@/lib/prisma";

const MEMBERSHIP_PRICES = {
  "Field Operational Membership": 37500,
  "Philantropic Membership": 225000,
  "Professional Membership Individual": 180000,
  "Corporate Membership": 75000,
};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const paymentData = response.data.data;
    const membership = paymentData.metadata?.membership;
    const paidAmount = paymentData.amount / 100;

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

    if (paymentData.status === "success") {
      await prisma.user.create({
        data: {
          fullname: paymentData.metadata?.fullname,
          email: paymentData.customer.email,
          phone: paymentData.metadata?.phone,
          membership: membership,
          amount: paidAmount,
          imageUrl: paymentData.metadata?.imageUrl,
          paymentStatus: paymentData.status,
        },
      });
    }

    return new Response(JSON.stringify(response.data), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://www.aspoi.com",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    return new Response(
      JSON.stringify({ error: "Payment verification failed" }),
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
