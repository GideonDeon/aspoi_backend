import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const MEMBERSHIP_PRICES = {
  "Field Operational Membership": 37500,
  "Philantropic Membership": 225000,
  "Professional Membership Individual": 180000,
  "Corporate Membership": 75000,
};

export async function POST(req) {
  try {
    const formData = await req.formData();

    const email = formData.get("email");
    const clientAmount = formData.get("amount");
    const fullname = formData.get("fullname");
    const phone = formData.get("phone");
    const membership = formData.get("membership");
    const imageFile = formData.get("image");

    if (!MEMBERSHIP_PRICES[membership]) {
      return NextResponse.json(
        { error: "Invalid membership type" },
        { status: 400 }
      );
    }


    const correctAmount = MEMBERSHIP_PRICES[membership];

   
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

    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);


    const timestamp = Date.now();
    const originalName = imageFile.name;
    const extension = originalName.split('.').pop();
    const sanitizedName = originalName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.(?=.*\.)/g, '_'); 
    const fileName = `${timestamp}_${sanitizedName}`;

    const date = new Date();
    const folderPath = `receipts/${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const filePath = `${folderPath}/${fileName}`;


    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("membership-receipts")
      .upload(filePath, buffer, {
        contentType: imageFile.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        { error: "File upload failed", details: uploadError.message },
        { status: 500 }
      );
    }

  
    const { data: publicUrlData } = supabase.storage
      .from("membership-receipts")
      .getPublicUrl(filePath);

    const imageUrl = publicUrlData.publicUrl;

   
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: correctAmount * 100,
        metadata: {
          fullname,
          phone,
          membership,
          imageUrl,
          validatedAmount: correctAmount,
          storagePath: filePath, 
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
        "Access-Control-Allow-Origin": "https://www.aspoi.com",
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
          "Access-Control-Allow-Origin": "https://www.aspoi.com",
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
      "Access-Control-Allow-Origin": "https://www.aspoi.com",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}