import OpenAI from "openai";

const apiKey = process.env.GROQ_API_KEY;

console.log("========== GROQ ENV CHECK ==========");
console.log("KEY PRESENT:", !!apiKey);
console.log("KEY LENGTH:", apiKey?.length ?? 0);
console.log("=====================================");

if (!apiKey) {
  throw new Error(
    "GROQ_API_KEY is missing. Check .env.local and restart Next.js.",
  );
}

const openai = new OpenAI({
  apiKey,
  baseURL: "https://api.groq.com/openai/v1",
});

export default openai;
