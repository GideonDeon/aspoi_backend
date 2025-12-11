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
  "Corporate Membership": 750000,
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

    const tx_ref = `ASPOI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      {
        tx_ref: tx_ref,
        amount: correctAmount,
        currency: "NGN",
        redirect_url: `${process.env.BASE_URL}/confirmation`,
        payment_options: "card,banktransfer,ussd,account",
        customer: {
          email: email,
          phonenumber: phone,
          name: fullname,
        },
        customizations: {
          title: "ASPOI Membership Payment",
          description: membership,
          logo: "https://www.aspoi.com/images/aspoi-logo",
        },
        meta: {
          fullname: fullname,
          email: email,
          phone: phone,
          membership: membership,
          imageUrl: imageUrl,
          validatedAmount: correctAmount,
          storagePath: filePath,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Flutterwave Response:", JSON.stringify(response.data, null, 2));

    return NextResponse.json(
      {
        status: "success",
        message: "Payment link generated",
        data: {
          link: response.data.data.link,
          tx_ref: tx_ref,
        },
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "https://www.aspoi.com",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    return NextResponse.json(
      { error: "Payment initialization failed", details: error.response?.data },
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