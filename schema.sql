-- 1. ตารางเก็บข้อมูลรายการเสื้อผ้าในตู้ (wardrobe_items)
CREATE TABLE wardrobe_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- เช่น top, bottom, shoes, dress, accessory
    color VARCHAR(50),
    style_tags TEXT[], -- เช่น ['casual', 'formal', 'streetwear']
    suitable_weather VARCHAR(50), -- เช่น hot, cold, rainy, all
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ตารางเก็บประวัติการจัดชุดของ AI (outfit_history)
CREATE TABLE outfit_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_input TEXT NOT NULL, -- โจทย์หรือคำขอที่ผู้ใช้พิมพ์
    recommended_top_id UUID REFERENCES wardrobe_items(id) ON DELETE SET NULL,
    recommended_bottom_id UUID REFERENCES wardrobe_items(id) ON DELETE SET NULL,
    recommended_shoes_id UUID REFERENCES wardrobe_items(id) ON DELETE SET NULL,
    reasoning TEXT, -- เหตุผลที่ AI เลือกชุดนี้
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
