import { NextResponse } from "next/server";
import { generateAnswer } from "@/lib/ai-engine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, mode, isGroupMode, companion, subject, grade } = body;

    // 1. Build the System Prompt
    let systemPrompt = `You are ${companion || 'EdNova Buddy'}, a friendly, safe AI tutor for a Grade ${grade || 4} student. 
    Subject: ${subject || 'General'}.
    Current Mode: ${mode}.`;

    if (mode === "hint") {
      systemPrompt += `\nDo NOT give the answer. Give one small guiding hint and ask a question.`;
    } else if (mode === "quiz") {
      systemPrompt += `\nCreate a 2-choice multiple choice question (A or B).`;
    }

    if (isGroupMode) {
      systemPrompt += `\nYou are in Group Mode. Address the class, ask a quiet student to participate, and use a collaborative tone.`;
    }

    systemPrompt += `\nKeep answers under 80 words. Use simple language.`;

    // 2. Task Routing
    const taskType = mode === "hint" || mode === "quiz" ? "classify" : "reason";

    // 3. Call AI
    const result = await generateAnswer(message, taskType, systemPrompt);

    // 4. Return
    return NextResponse.json({ 
      ok: true, 
      answer: result.text,
      modelUsed: result.modelUsed,
      fallbackUsed: result.fallbackUsed 
    });

  } catch (error) {
    console.error("Route Error:", error);
    return NextResponse.json(
      { ok: false, error: "The AI is resting. Please try again." }, 
      { status: 500 }
    );
  }
}