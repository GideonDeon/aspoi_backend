import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import axios from "axios";

// CRITICAL: Server-side pricing authority
const MEMBERSHIP_PRICES = {
  "Field Operational Membership": 1000,
  "Philantropic Membership": 225000,
  "Professional Membership Individual": 180000,
  "Corporate Membership": 750000,
};

export async function POST(req) {
  try {
    // Parse FormData from the request
    const formData = await req.formData();

    // Extract form fields
    const email = formData.get("email");
    const clientAmount = formData.get("amount"); // Get client amount but don't trust it
    const fullname = formData.get("fullname");
    const phone = formData.get("phone");
    const membership = formData.get("membership");
    const imageFile = formData.get("image");

    // SECURITY: Validate membership type exists
    if (!MEMBERSHIP_PRICES[membership]) {
      return NextResponse.json(
        { error: "Invalid membership type" },
        { status: 400 }
      );
    }

    // SECURITY: Use server-side price, ignore client amount
    const correctAmount = MEMBERSHIP_PRICES[membership];

    // Optional: Log if client tried to send different amount
    if (clientAmount && Number(clientAmount) !== correctAmount) {
      console.warn(
        `⚠️ Price mismatch detected for ${email}: client sent ${clientAmount}, correct is ${correctAmount}`
      );
    }

    if (!imageFile) {
      return NextResponse.json(
        { error: "No image file uploaded" },
        { status: 400 }
      );
    }

    // Convert the file to a buffer
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename to prevent overwrites
    const timestamp = Date.now();
    const originalName = imageFile.name;
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    const fileName = `${baseName}_${timestamp}${extension}`;

    const filePath = path.join(uploadDir, fileName);

    // Write the file
    fs.writeFileSync(filePath, buffer);

    const imageUrl = `/uploads/${fileName}`;

    // Initialize Paystack transaction with SERVER-VALIDATED amount
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: correctAmount * 100, // Use server price, not client price
        metadata: {
          fullname,
          phone,
          membership,
          imageUrl,
          validatedAmount: correctAmount, // Store for verification
        },
        callback_url: `${process.env.BASE_URL}/confirmation`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return NextResponse.json(response.data, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    return NextResponse.json(
      { error: "Payment initialization failed" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
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
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
