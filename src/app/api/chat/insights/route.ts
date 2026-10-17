import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    stats: { timeSpent: "3h 45m", questionsAsked: 42, conceptsMastered: 18, coinsEarned: 240, streak: 5 },
    breakdown: [
      { subject: "Science & Nature", percentage: 45, color: "bg-blue-600" },
      { subject: "Mathematics", percentage: 30, color: "bg-pink-500" },
      { subject: "English & Reading", percentage: 15, color: "bg-yellow-500" },
      { subject: "History & Space", percentage: 10, color: "bg-gray-400" },
    ],
  });
}