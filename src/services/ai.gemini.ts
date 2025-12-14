// Lazy-load Google Generative AI SDK so tests can run even if the dependency
// is not installed in the local environment. The real SDK will only be
// required when `askGeminiAI` is actually invoked.

interface GenerativeModel {
  generateContent(prompt: string): Promise<{ response: { text(): string } }>;
}

interface GenerativeAIClient {
  getGenerativeModel(options: { model: string }): GenerativeModel;
}

type GoogleGenerativeAIConstructor = new (apiKey: string) => GenerativeAIClient;

let genAI: GenerativeAIClient | null = null;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const loadGenAI = (): GenerativeAIClient => {
  if (!genAI) {
    // Using require here avoids TypeScript module resolution errors when
    // the SDK is not available in test environments.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { GoogleGenerativeAI } = require("@google/generative-ai") as {
      GoogleGenerativeAI: GoogleGenerativeAIConstructor;
    };
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }
  return genAI;
};

export const askGeminiAI = async (
  context: string,
  question: string
): Promise<string> => {
  const model = loadGenAI().getGenerativeModel({ model: "gemini-pro" });

  const prompt = `${context}\n\nPregunta: ${question}`;

  const { response } = await model.generateContent(prompt);
  const text = response.text();

  return text;
};