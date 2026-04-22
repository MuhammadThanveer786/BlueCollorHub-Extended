import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the AI with your secret key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function checkPostForSpam(title, description) {
  try {
    // We use the flash model because it is incredibly fast and cheap/free
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an expert AI moderator for "BlueCollorHub", a platform for honest manual laborers and tradespeople to find work.
      Analyze the following post title and description. 
      
      Look for:
      1. Spam, scam links, or "get rich quick" schemes.
      2. Inappropriate, offensive, or harmful language.
      3. Content that has absolutely nothing to do with offering a physical service, trade, or blue-collar work.

      Title: "${title}"
      Description: "${description}"

      Respond ONLY with a valid JSON object in this exact format. Do not add markdown formatting or extra text.
      {
        "isSpam": true,
        "confidenceScore": 95,
        "reason": "Brief explanation here"
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean the AI response to ensure we only parse the JSON
    const jsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("AI Moderation Error:", error);
    // If the AI fails to connect, we default to false so we don't accidentally block good users
    return { isSpam: false, confidenceScore: 0, reason: "AI Check Failed" };
  }
}