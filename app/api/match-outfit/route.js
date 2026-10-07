import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'กรุณาระบุสถานการณ์หรือโจทย์การแต่งตัว' }, { status: 400 });
    }

    // 1. ดึงข้อมูลเสื้อผ้าจาก Supabase (ค้นหาทั้งตาราง wardrobe และ wardrobe_items เพื่อป้องกันชื่อตารางไม่ตรง)
    let items = [];
    if (supabase) {
      let { data, error } = await supabase.from('wardrobe').select('*');
      
      if (error || !data || data.length === 0) {
        const res2 = await supabase.from('wardrobe_items').select('*');
        if (!res2.error && res2.data) {
          data = res2.data;
        }
      }

      if (data && data.length > 0) {
        items = data;
      }
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'ไม่พบเสื้อผ้าในตู้ กรุณาเพิ่มเสื้อผ้าก่อนครับ' }, { status: 400 });
    }

    // 2. ตรวจสอบ API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ยังไม่ได้ระบุ GEMINI_API_KEY ใน Vercel Environment Variables' }, { status: 500 });
    }

    const availableItemsSummary = items.map(i => ({
      id: i.id,
      name: i.name || i.title || 'เสื้อผ้า',
      category: i.category || 'other',
      color: i.color || 'ไม่ระบุ',
      image_url: i.image_url || i.url || i.image || ''
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

    // 3. ฟังก์ชันเรียกใช้ Gemini API พร้อมระบบ Fallback เปลี่ยนชื่อโมเดลให้อัตโนมัติถ้าเจอปัญหา
    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-1.5-flash'];
    let aiData = null;
    let lastErrorMessage = '';

    for (const model of modelsToTry) {
      try {
        const resAI = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        });

        const data = await resAI.json();
        if (resAI.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          aiData = data;
          break; // สำเร็จแล้วออกจากลูป
        } else {
          lastErrorMessage = data.error?.message || 'ข้อผิดพลาดไม่ทราบสาเหตุ';
        }
      } catch (err) {
        lastErrorMessage = err.message;
      }
    }

    if (!aiData) {
      return NextResponse.json({ 
        error: `Gemini API Error: ${lastErrorMessage}` 
      }, { status: 500 });
    }

    const rawText = aiData.candidates[0].content.parts[0].text;
    const result = JSON.parse(rawText);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Match outfit error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการประมวลผลของ AI: ' + error.message }, { status: 500 });
  }
}
