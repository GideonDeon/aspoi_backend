export default function handler(req, res) {
  res.status(200).json({
    PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY ? "Loaded ✅" : "Missing ❌"
  });
}
