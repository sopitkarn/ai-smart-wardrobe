import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'กรุณาระบุสถานการณ์หรือโจทย์การแต่งตัว' }, { status: 400 });
    }

    // 1. ดึงข้อมูลเสื้อผ้าจาก Supabase
    let items = [];
    if (supabase) {
      const { data, error } = await supabase.from('wardrobe_items').select('*');
      if (!error && data) {
        items = data;
      }
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'ไม่พบเสื้อผ้าในตู้ กรุณาเพิ่มเสื้อผ้าก่อนครับ' }, { status: 400 });
    }

    // 2. เช็ก API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ยังไม่ได้ระบุ GEMINI_API_KEY ใน Vercel Environment Variables' }, { status: 500 });
    }

    const availableItemsSummary = items.map(i => ({
      id: i.id,
      name: i.name || 'เสื้อผ้า',
      category: i.category || 'other',
      color: i.color || 'ไม่ระบุ',
      image_url: i.image_url || i.url || ''
    }));

    const systemPrompt = `คุณเป็น Stylist ส่วนตัว งานของคุณคือเลือกชุดแต่งตัวที่เข้ากันที่สุดจาก "รายการเสื้อผ้าที่มีจริงในตู้" ให้เข้ากับสถานการณ์ของผู้ใช้

สถานการณ์/โจทย์ของผู้ใช้: "${prompt}"

รายการเสื้อผ้าในตู้:
${JSON.stringify(availableItemsSummary, null, 2)}

ข้อบังคับสำคัญ:
1. เลือกเสื้อผ้าเฉพาะที่มี ID อยู่ในรายการข้างต้นเท่านั้น
2. ตอบกลับเป็นรูปแบบ JSON เดียวเท่านั้น ไม่มีข้อความ Markdown หรือโปรแกรมอื่นปน ดังนี้:
{
  "recommendation": "คำอธิบายเหตุผลในการเลือกชุดนี้เป็นภาษาไทย",
  "selected_items": [
    { "id": 1, "name": "ชื่อเสื้อ", "category": "top", "image_url": "urlรูป" },
    { "id": 2, "name": "ชื่อกางเกง", "category": "bottom", "image_url": "urlรูป" }
  ]
}`;

    // ส่งคำขอไปยัง Gemini 3.8 Flash
    const resAI = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: systemPrompt }]
        }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    const aiData = await resAI.json();

    if (!resAI.ok) {
      console.error('Gemini API Error Response:', aiData);
      return NextResponse.json({ 
        error: `Gemini API Error: ${aiData.error?.message || 'การเชื่อมต่อ API ไม่สำเร็จ'}` 
      }, { status: 500 });
    }

    const rawText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return NextResponse.json({ error: 'AI ไม่ได้ส่งข้อมูลตอบกลับมา' }, { status: 500 });
    }

    const result = JSON.parse(rawText);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Match outfit error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการประมวลผลของ AI: ' + error.message }, { status: 500 });
  }
}
