import OpenAI from "openai";

const isMock = process.env.MOCK_MODE === "true" || !process.env.LLM_API_KEY;

const openai = new OpenAI({
  apiKey: process.env.LLM_API_KEY || "mock",
  baseURL: process.env.LLM_BASE_URL || "https://api.openai.com/v1",
});

export type TaskType = "classify" | "reason" | "final";

export async function generateAnswer(
  prompt: string, 
  task: TaskType, 
  systemPrompt: string
): Promise<{ text: string; modelUsed: string; fallbackUsed: boolean }> {
  
  // 1. MOCK MODE
  if (isMock) {
    await new Promise((r) => setTimeout(r, 1000)); 
    return { 
      text: "Here is a fun science fact: Volcanoes erupt because the magma inside the Earth is under a lot of pressure, just like shaking a soda bottle! 🌋", 
      modelUsed: "mock-compact", 
      fallbackUsed: false 
    };
  }

  // 2. REAL AI ROUTING
  const isMidSize = task === "reason" || task === "final";
  const modelToUse = isMidSize 
    ? process.env.LLM_MODEL_MID || "gpt-4o-mini"
    : process.env.LLM_MODEL_COMPACT || "gpt-4o-mini";

  try {
    const res = await openai.chat.completions.create({
      model: modelToUse,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 250,
    });

    return {
      text: res.choices[0]?.message?.content || "I am thinking...",
      modelUsed: modelToUse,
      fallbackUsed: false
    };

  } catch (error: any) {
    console.error("AI Error:", error);
    
    // 3. RESILIENCE
    if (isMidSize && (error?.status === 503 || error?.status === 429)) {
      const fallbackRes = await openai.chat.completions.create({
        model: process.env.LLM_MODEL_COMPACT || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
      });
      return {
        text: fallbackRes.choices[0]?.message?.content || "Fallback answer...",
        modelUsed: process.env.LLM_MODEL_COMPACT || "gpt-4o-mini",
        fallbackUsed: true 
      };
    }
    throw error;
  }
}