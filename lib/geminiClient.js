import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('GEMINI_API_KEY is missing. Check your .env.local file.');
}

export const ai = new GoogleGenAI({ apiKey: apiKey || '' });

/**
 * ฟังก์ชันสำหรับขอคำแนะนำการแต่งตัวจากเสื้อผ้าที่มีในตู้
 * @param {Array} availableItems - รายการเสื้อผ้าในตู้
 * @param {String} prompt - ความต้องการของผู้ใช้ เช่น "อยากได้ชุดไปคาเฟ่ อากาศร้อน"
 */
export async function recommendOutfit(availableItems, prompt) {
  try {
    const systemInstruction = `คุณเป็น AI สไตลิสต์ส่วนตัว หน้าที่ของคุณคือเลือกจัดชุดแต่งตัวจากรายการเสื้อผ้าที่มีอยู่ในตู้ให้เข้ากับสถานการณ์ที่ผู้ใช้ระบุ
ให้เลือกเสื้อผ้า 3 ชิ้น (เสื้อ, กางเกง/กระโปรง, รองเท้า) จากรายการที่มี และอธิบายเหตุผลสั้นๆ

ตอบกลับเป็น JSON Format ดังนี้เท่านั้น:
{
  "recommended_top_id": "ID ของเสื้อ",
  "recommended_bottom_id": "ID ของกางเกงหรือกระโปรง",
  "recommended_shoes_id": "ID ของรองเท้า",
  "reasoning": "คำอธิบายเหตุผลในการเลือกแมตช์ชุดนี้"
}`;

    const contents = `รายการเสื้อผ้าที่มีในตู้:
${JSON.stringify(availableItems, null, 2)}

โจทย์/สถานการณ์วันนี้:
"${prompt}"`;
   const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error('Error in recommendOutfit:', error);
    throw error;
  }
}
