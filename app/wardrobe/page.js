'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function WardrobePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'top',
    color: '',
    style_tags: '',
    suitable_weather: '',
    description: '',
    image_url: ''
  });

  // โหลดรายการเสื้อผ้าจาก Supabase
  useEffect(() => {
    fetchWardrobeItems();
  }, []);

  const fetchWardrobeItems = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  // วิเคราะห์รูปภาพด้วย Gemini API
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // แปลงไฟล์รูปเป็น Base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result;
      setFormData(prev => ({ ...prev, image_url: base64Image }));
      setAnalyzing(true);

      try {
        const res = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64Image })
        });

        const data = await res.json();
        if (res.ok && data) {
          setFormData(prev => ({
            ...prev,
            name: data.name || prev.name,
            category: data.category || prev.category,
            color: data.color || prev.color,
            style_tags: Array.isArray(data.style_tags) ? data.style_tags.join(', ') : data.style_tags || '',
            suitable_weather: Array.isArray(data.suitable_weather) ? data.suitable_weather.join(', ') : data.suitable_weather || '',
            description: data.description || prev.description
          }));
        }
      } catch (err) {
        console.error('Failed to analyze image:', err);
      } finally {
        setAnalyzing(false);
      }
    };
  };

  // บันทึกลง Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return alert('กรุณากรอกชื่อเสื้อผ้า');

    const newItem = {
      name: formData.name,
      category: formData.category,
      color: formData.color,
      style_tags: formData.style_tags.split(',').map(s => s.trim()).filter(Boolean),
      suitable_weather: formData.suitable_weather.split(',').map(w => w.trim()).filter(Boolean),
      description: formData.description,
      image_url: formData.image_url
    };

    if (supabase) {
      const { error } = await supabase.from('wardrobe_items').insert([newItem]);
      if (error) {
        alert('เกิดข้อผิดพลาดในการบันทึก: ' + error.message);
        return;
      }
      fetchWardrobeItems();
    } else {
      // Mock Fallback
      setItems(prev => [{ ...newItem, id: Date.now() }, ...prev]);
    }

    // Reset Form
    setFormData({
      name: '',
      category: 'top',
      color: '',
      style_tags: '',
      suitable_weather: '',
      description: '',
      image_url: ''
    });
    alert('บันทึกลงตู้เสื้อผ้าเรียบร้อย!');
  };

  // ลบรายการ
  const handleDelete = async (id) => {
    if (!confirm('คุณต้องการลบเสื้อผ้าชิ้นนี้ใช่หรือไม่?')) return;

    if (supabase) {
      await supabase.from('wardrobe_items').delete().eq('id', id);
      fetchWardrobeItems();
    } else {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const filteredItems = activeTab === 'all' 
    ? items 
    : items.filter(item => item.category === activeTab);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">
              ตู้เสื้อผ้าของฉัน (My Wardrobe) 👔
            </h1>
            <p className="text-sm text-slate-400">จัดการและเพิ่มเสื้อผ้าเข้าตู้ด้วย AI</p>
          </div>
          <Link href="/match" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs md:text-sm font-semibold transition shadow-lg">
            ✨ ให้ AI จัดชุด
          </Link>
        </header>

        {/* Add Item Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-slate-200">➕ เพิ่มเสื้อผ้าใหม่</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Upload Image Section */}
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-purple-500 rounded-xl p-4 transition bg-slate-950/50">
              {formData.image_url ? (
                <div className="relative w-32 h-32 mb-2">
                  <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                </div>
              ) : null}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                id="file-upload"
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm transition font-medium">
                📸 {formData.image_url ? 'เปลี่ยนรูปภาพ' : 'อัปโหลด/ถ่ายรูปภาพเสื้อผ้า'}
              </label>
              {analyzing && (
                <p className="text-xs text-purple-400 mt-2 animate-pulse">✨ Gemini Vision AI กำลังวิเคราะห์รูปภาพ...</p>
              )}
            </div>

            {/* Form Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">ชื่อเสื้อผ้า</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น เสื้อยืด Oversize สีขาว"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">หมวดหมู่</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="top">เสื้อ (Top)</option>
                  <option value="bottom">กางเกง/กระโปรง (Bottom)</option>
                  <option value="shoes">รองเท้า (Shoes)</option>
                  <option value="outerwear">เสื้อคลุม (Outerwear)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">สีหลัก</label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={e => setFormData({ ...formData, color: e.target.value })}
                  placeholder="เช่น ขาว, ดำ, ฟ้า"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">สไตล์ (คั่นด้วยจุลภาค)</label>
                <input
                  type="text"
                  value={formData.style_tags}
                  onChange={e => setFormData({ ...formData, style_tags: e.target.value })}
                  placeholder="เช่น casual, minimal, formal"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">สภาพอากาศที่เหมาะสม</label>
              <input
                type="text"
                value={formData.suitable_weather}
                onChange={e => setFormData({ ...formData, suitable_weather: e.target.value })}
                placeholder="เช่น hot, cool, rainy"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition shadow-lg text-sm"
            >
              💾 บันทึกลงตู้เสื้อผ้า
            </button>
          </form>
        </div>

        {/* Display Items Section */}
        <div className="space-y-4">
          {/* Tabs Filter */}
          <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
            {[
              { key: 'all', label: 'ทั้งหมด' },
              { key: 'top', label: 'เสื้อ' },
              { key: 'bottom', label: 'กางเกง/กระโปรง' },
              { key: 'shoes', label: 'รองเท้า' },
              { key: 'outerwear', label: 'เสื้อคลุม' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Items Grid */}
          {loading ? (
            <p className="text-center text-slate-500 text-sm py-8">กำลังโหลดข้อมูล...</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-8">ยังไม่มีรายการเสื้อผ้าในหมวดหมู่นี้</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredItems.map(item => (
                <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between space-y-2 group">
                  <div className="w-full h-36 bg-slate-950 rounded-lg overflow-hidden relative">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">ไม่มีรูปภาพ</div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100 line-clamp-1">{item.name}</h3>
                    <p className="text-xs text-slate-400">สี: {item.color || '-'}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="w-full py-1.5 bg-red-950/40 hover:bg-red-900 text-red-300 rounded-lg text-xs transition border border-red-800/40"
                  >
                    🗑️ ลบ
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
