import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const members = await prisma.user.findMany({
      where: { paymentStatus: "success" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullname: true,
        email: true,
        membership: true,
        imageUrl: true,
      },
    });

    return NextResponse.json(members, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://www.aspoi.com/",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "https://www.aspoi.com/",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "https://www.aspoi.com/",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
