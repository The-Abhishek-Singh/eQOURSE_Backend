import Groq from "groq-sdk";

const ALLOWED_CATEGORIES = ["Billing", "Technical", "Sales", "General"];

export async function classifySupportMessage(message) {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    // Fallback immediately if key is missing without crashing
    if (!apiKey) {
      console.warn("GROQ_API_KEY is not set. Using FALLBACK category.");
      return { category: "General", classificationSource: "FALLBACK" };
    }

    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "You are a strict support ticket classifier. Classify the customer query into EXACTLY ONE of these categories: Billing, Technical, Sales, General. Respond ONLY with the single category word. Do not add punctuation or explanation.",
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0,
      max_tokens: 10,
    });

    const rawCategory = completion.choices[0]?.message?.content?.trim();

    if (ALLOWED_CATEGORIES.includes(rawCategory)) {
      return { category: rawCategory, classificationSource: "AI" };
    }

    console.warn(
      `AI returned invalid category "${rawCategory}". Using FALLBACK.`,
    );
    return { category: "General", classificationSource: "FALLBACK" };
  } catch (error) {
    console.error("AI service error:", error.message);
    return { category: "General", classificationSource: "FALLBACK" };
  }
}
