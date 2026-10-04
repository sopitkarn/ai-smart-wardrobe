import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
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
      const { data, error } = await supabase.from('wardrobe_items').select('*');
      if (!error && data) {
        items = data;
      }
    }

    // กรณีไม่มีข้อมูลในฐานข้อมูล ให้ใช้ Mock Items สำหรับทดสอบ
    if (!items || items.length === 0) {
      items = [
        { id: 1, name: 'เสื้อยืด Oversize สีขาว', category: 'top', color: 'ขาว', style_tags: ['casual', 'minimal'], suitable_weather: ['hot'], image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500' },
        { id: 2, name: 'เสื้อเชิ้ตแขนยาว สีฟ้า', category: 'top', color: 'ฟ้า', style_tags: ['formal', 'work'], suitable_weather: ['cool', 'hot'], image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500' },
        { id: 3, name: 'กางเกงสแล็ค สีดำ', category: 'bottom', color: 'ดำ', style_tags: ['formal', 'work'], suitable_weather: ['hot', 'cool'], image_url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500' },
        { id: 4, name: 'กางเกงยีนส์ทรงขากระบอก', category: 'bottom', color: 'น้ำเงิน', style_tags: ['casual', 'street'], suitable_weather: ['hot', 'cool'], image_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500' },
        { id: 5, name: 'รองเท้าผ้าใบสีขาว', category: 'shoes', color: 'ขาว', style_tags: ['casual', 'street'], suitable_weather: ['hot', 'cool'], image_url: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=500' },
        { id: 6, name: 'เสื้อแจ็คเก็ตยีนส์', category: 'outerwear', color: 'ยีนส์', style_tags: ['casual', 'street'], suitable_weather: ['cool', 'rainy'], image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500' }
      ];
    }

    // 2. เรียกใช้ Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Fallback ถ้ายังไม่ตั้งค่า GEMINI_API_KEY
      const mockTop = items.find(i => i.category === 'top') || items[0];
      const mockBottom = items.find(i => i.category === 'bottom') || items[1];
      const mockShoes = items.find(i => i.category === 'shoes') || items[2];
      
      return NextResponse.json({
        top_id: mockTop?.id,
        bottom_id: mockBottom?.id,
        shoes_id: mockShoes?.id,
        outerwear_id: null,
        reasoning: `(Mock Mode) เลือก ${mockTop?.name} คู่กับ ${mockBottom?.name} เพื่อความสะดวกสบาย เหมาะสำหรับสถานการณ์: "${prompt}"`
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const availableItemsSummary = items.map(i => ({
      id: i.id,
      name: i.name,
      category: i.category,
      color: i.color,
      style_tags: i.style_tags,
      suitable_weather: i.suitable_weather
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `คุณเป็น Stylist ส่วนตัว งานของคุณคือเลือกชุดแต่งตัวที่เข้ากันที่สุดจาก "รายการเสื้อผ้าที่มีจริงในตู้" ให้เข้ากับสถานการณ์ของผู้ใช้

สถานการณ์/โจทย์ของผู้ใช้: "${prompt}"

รายการเสื้อผ้าที่มีจริงในตู้เสื้อผ้า:
${JSON.stringify(availableItemsSummary, null, 2)}

ข้อบังคับสำคัญ:
1. คุณต้องเลือกเสื้อผ้าโดยใช้ ID ที่มีอยู่ในรายการข้างต้นเท่านั้น ห้ามสร้างหรือคิด ID หรือเสื้อผ้าที่ไม่มีอยู่จริงเด็ดขาด
2. ให้เลือก:
   - top_id: ID ของเสื้อ ( category = 'top' )
   - bottom_id: ID ของท่อนล่าง ( category = 'bottom' )
   - shoes_id: ID ของรองเท้า ( category = 'shoes' )
   - outerwear_id: ID ของเสื้อคลุม ( category = 'outerwear' ) หากไม่จำเป็นต้องใส่ให้ตอบ null
3. อธิบายเหตุผลภาษาไทยอย่างเป็นกันเองและตรงประเด็นในช่อง reasoning`
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            top_id: { type: Type.INTEGER, description: 'ID ของเสื้อท่อนบนที่เลือก' },
            bottom_id: { type: Type.INTEGER, description: 'ID ของกางเกง/กระโปรงท่อนล่างที่เลือก' },
            shoes_id: { type: Type.INTEGER, description: 'ID ของรองเท้าที่เลือก' },
            outerwear_id: { type: Type.INTEGER, nullable: true, description: 'ID ของเสื้อคลุม (ถ้ามี)' },
            reasoning: { type: Type.STRING, description: 'เหตุผลสั้นๆ ประกอบการเลือกชุด' }
          },
          required: ['top_id', 'bottom_id', 'shoes_id', 'reasoning']
        }
      }
    });

    const result = JSON.parse(response.text);

    // 3. บันทึกประวัติลง Supabase (ถ้ามี)
    if (supabase) {
      await supabase.from('outfit_history').insert([
        {
          prompt_input: prompt,
          recommended_top_id: result.top_id,
          recommended_bottom_id: result.bottom_id,
          recommended_shoes_id: result.shoes_id,
          reasoning: result.reasoning
        }
      ]);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Match outfit error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการประมวลผลของ AI' }, { status: 500 });
  }
}
