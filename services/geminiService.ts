import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Category } from "../types";

const getAIClient = () => {
  if (!process.env.API_KEY) {
    console.warn("API Key is missing. AI features will not work.");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeReceipt = async (base64Image: string): Promise<any> => {
  const ai = getAIClient();
  if (!ai) throw new Error("API Key missing");

  // Remove data URL prefix if present for the API call
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png", // Assuming PNG or generic image for simplicity
              data: cleanBase64,
            },
          },
          {
            text: "Analyze this receipt image. Extract the total amount, date, merchant name, and suggest a category from: Food, Transportation, Shopping, Entertainment, Housing, Utilities, Others.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            total: { type: Type.NUMBER },
            date: { type: Type.STRING, description: "ISO Date string if possible, else YYYY-MM-DD" },
            merchant: { type: Type.STRING },
            category: { type: Type.STRING },
            summary: { type: Type.STRING },
          },
          required: ["total", "merchant", "category"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Receipt Scan Error:", error);
    throw error;
  }
};

export const getFinancialInsights = async (transactions: Transaction[], categories: Category[]): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "AI services unavailable. Please check your API key.";

  // Simplify data for the prompt to save tokens
  const recentTx = transactions.slice(0, 50).map(t => {
    const catName = categories.find(c => c.id === t.categoryId)?.name || 'Unknown';
    return `${t.date.split('T')[0]}: ${t.type} ${t.amount} (${catName})`;
  }).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a financial advisor. Analyze these recent transactions and provide 3 brief, actionable insights or warnings in markdown format. Be encouraging but realistic.\n\nData:\n${recentTx}`,
    });
    return response.text || "No insights available.";
  } catch (error) {
    console.error("Gemini Insights Error:", error);
    return "Could not generate insights at this time.";
  }
};
