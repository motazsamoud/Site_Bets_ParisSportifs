"use client";
import BetSlip from "@/components/BetSlip";

export default function CouponsPage() {
  const userId = "demo-user"; // à remplacer par ton vrai id user plus tard
  return (
    <div className="min-h-screen bg-[#0b1018] text-white flex flex-col items-center pt-10">
      <h1 className="text-2xl font-bold mb-6">🧾 Ma feuille de pari</h1>
      <div className="w-full max-w-md">
        <BetSlip userId={userId} />
      </div>
    </div>
  );
}
