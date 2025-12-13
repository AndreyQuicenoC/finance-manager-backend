import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export const askGeminiAI = async (
  context: string,
  question: string
): Promise<string> => {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: context,
      },
      {
        role: "user",
        content: question,
      },
    ],
    temperature: 0.4,
  });

  return completion.choices[0].message?.content ?? "";
};