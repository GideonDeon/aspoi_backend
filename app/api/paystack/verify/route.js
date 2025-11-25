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

    // Save or update user record in DB
    await prisma.user.upsert({
      where: { email: paymentData.customer.email },
      update: {
        fullname: paymentData.metadata?.fullname,
        phone: paymentData.metadata?.phone,
        membership: paymentData.metadata?.membership,
        amount: paymentData.amount / 100,
        imageUrl: paymentData.metadata?.imageUrl, // <-- store uploaded image
        paymentStatus: paymentData.status
      },
      create: {
        fullname: paymentData.metadata?.fullname,
        email: paymentData.customer.email,
        phone: paymentData.metadata?.phone,
        membership: paymentData.metadata?.membership,
        amount: paymentData.amount / 100,
        imageUrl: paymentData.metadata?.imageUrl, // <-- store uploaded image
        paymentStatus: paymentData.status
      },
    });

    return new Response(JSON.stringify(response.data), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
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
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
