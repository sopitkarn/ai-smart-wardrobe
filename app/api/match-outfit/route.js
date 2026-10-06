import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'กรุณาระบุสถานการณ์หรือโจทย์การแต่งตัว' }, { status: 400 });
    }

    // 1. ดึงข้อมูลเสื้อผ้าทั้งหมดจาก Supabase
    let items = [];
    if (supabase) {
      const { data, error } = await supabase.from('clothes').select('*');
      if (!error && data) {
        items = data;
      }
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'ไม่พบเสื้อผ้าในตู้ กรุณาเพิ่มเสื้อผ้าก่อนครับ' }, { status: 400 });
    }

    // 2. เรียกใช้ Gemini API ผ่าน REST Fetch
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Vercel' }, { status: 500 });
    }

    const availableItemsSummary = items.map(i => ({
      id: i.id,
      name: i.name,
      category: i.category,
      color: i.color,
      style_tags: i.style_tags,
      suitable_weather: i.suitable_weather
    }));

    const systemPrompt = `คุณเป็น Stylist ส่วนตัว งานของคุณคือเลือกชุดแต่งตัวที่เข้ากันที่สุดจาก "รายการเสื้อผ้าที่มีจริงในตู้" ให้เข้ากับสถานการณ์ของผู้ใช้

สถานการณ์/โจทย์ของผู้ใช้: "${prompt}"

รายการเสื้อผ้าที่มีจริงในตู้เสื้อผ้า:
${JSON.stringify(availableItemsSummary, null, 2)}

ข้อบังคับสำคัญ:
1. คุณต้องเลือกเสื้อผ้าโดยใช้ ID ที่มีอยู่ในรายการข้างต้นเท่านั้น
2. ตอบกลับเป็นรูปแบบ JSON เดียวเท่านั้น ไม่มีข้อความอื่นปน ดังนี้:
{
  "top_id": 1,
  "bottom_id": 2,
  "shoes_id": 3,
  "outerwear_id": null,
  "reasoning": "เหตุผลสั้นๆ ภาษาไทยประกอบการเลือกชุด"
}`;

    const resAI = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    const aiData = await resAI.json();

    if (!resAI.ok || !aiData.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Gemini API Response Error:', aiData);
      return NextResponse.json({ error: 'Gemini API ประมวลผลไม่สำเร็จ' }, { status: 500 });
    }

    const rawText = aiData.candidates[0].content.parts[0].text;
    const result = JSON.parse(rawText);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Match outfit error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการประมวลผลของ AI' }, { status: 500 });
  }
}
