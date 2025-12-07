"use client";

import { Suspense } from "react";
import ConfirmationContent from "./ConfirmationContent"

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<p className="mt-5 ml-5">Loading confirmation...</p>}>
      <ConfirmationContent />
    </Suspense>
  );
}
