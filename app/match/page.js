'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
export default function MatchOutfitPage() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // โจทย์ตัวอย่างด่วน
  const quickPrompts = [
    'พรุ่งนี้เรียน 8 โมง อากาศร้อน ต้องเดินเยอะ',
    'ไปคาเฟ่มินิมอล ถ่ายรูปสวย เน้นสตรีทชิคๆ',
    'มีประชุมงานเป็นทางการช่วงบ่าย ต้องการความน่าเชื่อถือ',
    'เดตตอนเย็น ร้านอาหารชิลๆ อากาศเย็นเล็กน้อย'
  ];

  // โหลดรายการเสื้อผ้าทั้งหมดจาก Supabase
  useEffect(() => {
    async function fetchItems() {
      if (!supabase) return;
      const { data, error } = await supabase.from('wardrobe_items').select('*');
      if (!error && data) {
        setWardrobeItems(data);
      }
    }
    fetchItems();
  }, []);

  const handleMatch = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setRecommendation(null);

    try {
      const res = await fetch('/api/match-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาด');
      }

      setRecommendation(data);
    } catch (err) {
      setErrorMsg(err.message || 'ไม่สามารถให้ AI จัดชุดได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  // ดึงข้อมูลเสื้อผ้าตาม ID จาก state หรือ mock
  const getItemById = (id) => {
    if (!id) return null;
    return wardrobeItems.find((item) => item.id === id) || null;
  };

  const topItem = recommendation ? getItemById(recommendation.top_id) : null;
  const bottomItem = recommendation ? getItemById(recommendation.bottom_id) : null;
  const shoesItem = recommendation ? getItemById(recommendation.shoes_id) : null;
  const outerwearItem = recommendation ? getItemById(recommendation.outerwear_id) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-amber-300">
              Smart Outfit Matcher ✨
            </h1>
            <p className="text-sm text-slate-400">ให้ AI ช่วยเลือกชุดที่ดีที่สุดจากตู้เสื้อผ้าของคุณ</p>
          </div>
          <Link href="/wardrobe" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs md:text-sm font-medium transition border border-slate-700">
            ← ตู้เสื้อผ้า
          </Link>
        </header>

        {/* Input & Form Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <form onSubmit={handleMatch} className="space-y-4">
            <label className="block text-sm font-medium text-slate-300">
              บอกสถานการณ์หรือสไตล์ที่คุณต้องการวันนี้:
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="เช่น พรุ่งนี้เรียน 8 โมง อากาศร้อน ต้องเดินเยอะ, ไปคาเฟ่ชิลๆ..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base resize-none"
            />

            {/* Quick Prompts */}
            <div>
              <p className="text-xs text-slate-400 mb-2">ตัวอย่างโจทย์ยอดฮิต:</p>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(q)}
                    className="text-xs bg-slate-800 hover:bg-purple-900/40 hover:border-purple-500 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition text-left"
                  >
                    💡 {q}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>AI กำลังค้นตู้และแมตช์ชุด...</span>
                </>
              ) : (
                <>
                  <span>✨ ให้ AI จัดชุดให้วันนี้</span>
                </>
              )}
            </button>
          </form>

          {errorMsg && (
            <div className="p-4 bg-red-950/50 border border-red-800 text-red-300 text-sm rounded-xl">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Results Section */}
        {recommendation && (
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 shadow-2xl space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-amber-300 flex items-center gap-2">
              <span>🎯</span> ชุดที่ AI แนะนำสำหรับคุณ
            </h2>

            {/* Reasoning Box */}
            <div className="bg-purple-950/40 border border-purple-800/50 p-4 rounded-xl text-purple-200 text-sm leading-relaxed">
              <span className="font-semibold text-purple-300 block mb-1">💡 เหตุผลในการเลือกชุดนี้:</span>
              {recommendation.reasoning}
            </div>

            {/* Selected Items Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Top */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col items-center text-center">
                <span className="text-xs text-purple-400 font-semibold mb-2">ท่อนบน (Top)</span>
                <div className="w-full h-32 bg-slate-900 rounded-lg overflow-hidden mb-2 relative">
                  {topItem?.image_url ? (
                    <img src={topItem.image_url} alt={topItem.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">ไม่มีรูปภาพ</div>
                  )}
                </div>
                <p className="text-xs font-medium text-slate-200 line-clamp-2">{topItem ? topItem.name : `ID: ${recommendation.top_id}`}</p>
              </div>

              {/* Bottom */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col items-center text-center">
                <span className="text-xs text-purple-400 font-semibold mb-2">ท่อนล่าง (Bottom)</span>
                <div className="w-full h-32 bg-slate-900 rounded-lg overflow-hidden mb-2 relative">
                  {bottomItem?.image_url ? (
                    <img src={bottomItem.image_url} alt={bottomItem.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">ไม่มีรูปภาพ</div>
                  )}
                </div>
                <p className="text-xs font-medium text-slate-200 line-clamp-2">{bottomItem ? bottomItem.name : `ID: ${recommendation.bottom_id}`}</p>
              </div>

              {/* Shoes */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col items-center text-center">
                <span className="text-xs text-purple-400 font-semibold mb-2">รองเท้า (Shoes)</span>
                <div className="w-full h-32 bg-slate-900 rounded-lg overflow-hidden mb-2 relative">
                  {shoesItem?.image_url ? (
                    <img src={shoesItem.image_url} alt={shoesItem.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">ไม่มีรูปภาพ</div>
                  )}
                </div>
                <p className="text-xs font-medium text-slate-200 line-clamp-2">{shoesItem ? shoesItem.name : `ID: ${recommendation.shoes_id}`}</p>
              </div>

              {/* Outerwear (Optional) */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col items-center text-center">
                <span className="text-xs text-purple-400 font-semibold mb-2">เสื้อคลุม (Outerwear)</span>
                {recommendation.outerwear_id && outerwearItem ? (
                  <>
                    <div className="w-full h-32 bg-slate-900 rounded-lg overflow-hidden mb-2 relative">
                      <img src={outerwearItem.image_url} alt={outerwearItem.name} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs font-medium text-slate-200 line-clamp-2">{outerwearItem.name}</p>
                  </>
                ) : (
                  <div className="w-full h-32 border border-dashed border-slate-800 rounded-lg flex items-center justify-center text-slate-600 text-xs">
                    ไม่ต้องใส่เสื้อคลุม
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
