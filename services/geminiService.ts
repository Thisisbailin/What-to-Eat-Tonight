import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, MealEntry, DayLog, MealType, NutritionData } from "../types";
import { getExactRecipeMatch } from "../data/recipes";

// Helper to get AI client safely
// This lazy-loads the client so the app doesn't crash on startup if the key is missing
const getAiClient = () => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
  } catch (e) {
    console.error("Failed to initialize Gemini Client", e);
  }
  return null;
};

const SYSTEM_INSTRUCTION = `
You are "Pudding" (布丁), a cute, caring, and professional AI Nutritionist for young women. 
Your tone is gentle, encouraging, empathetic, and slightly playful (kawaii). 
You use emojis occasionally. 
You balance professional nutritional science with emotional support.
Always prioritize the user's health and well-being.
Do not recommend extreme diets.

IMPORTANT: ALWAYS RESPOND IN SIMPLIFIED CHINESE (简体中文).
`;

export const analyzeMeal = async (mealDescription: string, userProfile: UserProfile): Promise<NutritionData | null> => {
  // 1. Check Local Database first for speed
  const localMatch = getExactRecipeMatch(mealDescription.trim());
  if (localMatch) {
    // Generate context-aware feedback locally if possible, or append to default
    let suggestion = "";
    if (userProfile.goal === 'lose_weight' && localMatch.calories > 500) {
        suggestion = "热量稍稍有点高，晚一点可以适当活动一下哦。";
    } else if (userProfile.goal === 'gain_muscle' && parseFloat(localMatch.protein) < 15) {
        suggestion = "蛋白质还可以再多一点，加个蛋或者喝杯奶吧！";
    }

    return {
        calories: localMatch.calories,
        protein: localMatch.protein,
        carbs: localMatch.carbs,
        fat: localMatch.fat,
        tags: localMatch.tags,
        healthScore: localMatch.healthScore,
        feedback: localMatch.defaultFeedback,
        suggestion: suggestion || undefined
    };
  }

  // 2. Fallback to AI Analysis
  const ai = getAiClient();
  if (!ai) {
      console.error("API Key is missing.");
      return null;
  }

  const modelId = "gemini-2.5-flash";
  
  const prompt = `
    Analyze the following meal: "${mealDescription}".
    User context: ${JSON.stringify(userProfile)}.
    Return a JSON object with nutritional estimates, tags, health score (0-100), feedback (gentle commentary), and a suggestion for improvement.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            calories: { type: Type.NUMBER },
            protein: { type: Type.STRING },
            carbs: { type: Type.STRING },
            fat: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            healthScore: { type: Type.NUMBER },
            feedback: { type: Type.STRING },
            suggestion: { type: Type.STRING },
          },
          required: ["calories", "healthScore", "feedback", "tags"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error analyzing meal:", error);
    return null;
  }
};

export const getMealRecommendation = async (
  mealType: MealType, 
  userProfile: UserProfile, 
  recentLogs: DayLog[]
): Promise<any[]> => {
  const ai = getAiClient();
  if (!ai) return [];

  const modelId = "gemini-2.5-flash";

  const historySummary = recentLogs.map(log => ({
    date: log.date,
    meals: log.meals.map(m => m.description)
  }));

  const prompt = `
    Suggest 3 distinct options for ${mealType}.
    User Context: ${JSON.stringify(userProfile)}.
    Recent History: ${JSON.stringify(historySummary)}.
    Consider her cycle phase if provided.
    Return a JSON array of recommendation objects.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              reason: { type: Type.STRING, description: "Why this is good for her now" },
              nutritionHighlights: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            }
          }
        },
      },
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error getting recommendations:", error);
    return [];
  }
};

export const getDailyReport = async (
  dayLog: DayLog,
  userProfile: UserProfile
): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "API Key 未配置，无法生成报告";
    
    const modelId = "gemini-2.5-flash";
    const prompt = `
        Generate a short, encouraging daily summary report (max 100 words) based on today's meals and mood.
        Day Log: ${JSON.stringify(dayLog)}.
        User Profile: ${JSON.stringify(userProfile)}.
        Address the user directly. Use a warm, caring tone.
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
            }
        });
        return response.text || "今天也要加油哦！";
    } catch (e) {
        return "数据获取失败，但请记得爱自己！";
    }
}