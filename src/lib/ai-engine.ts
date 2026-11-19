import OpenAI from "openai";

const isMock = process.env.MOCK_MODE === "true";
const openai = new OpenAI({
  apiKey: process.env.LLM_API_KEY || "mock",
  baseURL: process.env.LLM_BASE_URL || "http://localhost:11434/v1",
});

export type TaskType = "classify" | "reason" | "final";

export async function generateAnswer(prompt: string, task: TaskType, systemPrompt: string) {
  if (isMock) {
    await new Promise((r) => setTimeout(r, 1000)); 
    // Smart Mock: If in hint mode, give a hint. If explain, give an explanation.
    if (prompt.includes("hint") || systemPrompt.includes("hint")) {
        return { text: "Here is a hint: Think about what happens when you add numbers together. What comes after 5?", modelUsed: "mock-compact", fallbackUsed: false };
    }
    return { text: "Great question! Think of it like building blocks. Each piece adds up to the whole picture. 🌟", modelUsed: "mock-mid", fallbackUsed: false };
  }

  const isMidSize = task === "reason" || task === "final";
  const modelToUse = isMidSize ? process.env.LLM_MODEL_MID || "gpt-4o-mini" : process.env.LLM_MODEL_COMPACT || "gpt-4o-mini";

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
    return { text: res.choices[0]?.message?.content || "I am thinking...", modelUsed: modelToUse, fallbackUsed: false };
  } catch (error: any) {
    if (isMidSize && (error?.status === 503 || error?.status === 429)) {
      const fallbackRes = await openai.chat.completions.create({
        model: process.env.LLM_MODEL_COMPACT || "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }],
      });
      return { text: fallbackRes.choices[0]?.message?.content || "Fallback...", modelUsed: "compact", fallbackUsed: true };
    }
    throw error;
  }
}