import axios from "axios";
import prisma from "@/lib/prisma";

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

    // Save user record in DB
    await prisma.user.create({
      data: {
        fullname: paymentData.metadata.fullname,
        email: paymentData.customer.email,
        phone: paymentData.metadata.phone,
        membership: paymentData.metadata.membership,
        amount: paymentData.amount / 100, // convert from kobo
        paymentStatus: paymentData.status,
      },
    });

    return new Response(JSON.stringify(response.data), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // allow all origins
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    return new Response(
      JSON.stringify({ error: "Payment verification failed" }),
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}