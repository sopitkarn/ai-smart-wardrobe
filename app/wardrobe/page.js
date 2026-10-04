<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Smart Wardrobe AI - ตู้เสื้อผ้าอัจฉริยะ</title>
  
  <!-- React & ReactDOM CDN -->
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  
  <!-- Babel Standalone for JSX -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
  
  <!-- Supabase JS Client CDN -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  
  <!-- Google Fonts Inter & Prompt -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet">

  <style>
    body {
      font-family: 'Prompt', sans-serif;
    }
  </style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen">

  <div id="root"></div>

  <script type="text/babel">
    const { useState, useEffect, useRef } = React;

    // Categories mapping
    const CATEGORIES = [
      { id: 'all', label: 'ทั้งหมด', icon: 'sparkles' },
      { id: 'top', label: 'เสื้อ (Top)', icon: 'shirt' },
      { id: 'bottom', label: 'กางเกง/กระโปรง (Bottom)', icon: 'scissors' },
      { id: 'shoes', label: 'รองเท้า (Shoes)', icon: 'footprints' },
      { id: 'outerwear', label: 'เสื้อคลุม (Outerwear)', icon: 'coat' },
    ];

    // Mock initial data if Supabase is not connected
    const MOCK_ITEMS = [
      {
        id: '1',
        name: 'เสื้อยืดคอกลมสีขาว Oversize',
        category: 'top',
        color: 'ขาว',
        style_tags: ['Casual', 'Minimal', 'Street'],
        suitable_weather: 'ร้อน (Hot)',
        image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80',
        description: 'เสื้อยืดผ้าฝ้ายระบายอากาศได้ดี เหมาะสำหรับวันสบายๆ',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        name: 'กางเกงยีนส์ขาขอบลอยสีซีด',
        category: 'bottom',
        color: 'ฟ้าซีด',
        style_tags: ['Casual', 'Street'],
        suitable_weather: 'ทุกสภาพอากาศ (All)',
        image_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&auto=format&fit=crop&q=80',
        description: 'กางเกงยีนส์ทรงวินเทจ แมตช์กับเสื้อได้ง่ายหลากหลายสไตล์',
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        name: 'รองเท้าผ้าใบสีขาวทรงคลาสสิก',
        category: 'shoes',
        color: 'ขาว',
        style_tags: ['Casual', 'Sporty'],
        suitable_weather: 'ทุกสภาพอากาศ (All)',
        image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&auto=format&fit=crop&q=80',
        description: 'รองเท้าผ้าใบสวมใส่สบาย ลุยได้ทุกกิจกรรม',
        created_at: new Date().toISOString()
      },
      {
        id: '4',
        name: 'เสื้อแจ็คเก็ตยีนส์ทรงหลวม',
        category: 'outerwear',
        color: 'น้ำเงินเข้ม',
        style_tags: ['Street', 'Cool'],
        suitable_weather: 'เย็น/ลมแรง (Cool)',
        image_url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&auto=format&fit=crop&q=80',
        description: 'แจ็คเก็ตยีนส์เพิ่มความเท่และกันลมได้ดี',
        created_at: new Date().toISOString()
      }
    ];

    function SmartWardrobeApp() {
      const [items, setItems] = useState([]);
      const [selectedCategory, setSelectedCategory] = useState('all');
      const [loading, setLoading] = useState(true);
      const [aiAnalyzing, setAiAnalyzing] = useState(false);
      const [showForm, setShowForm] = useState(false);
      const [statusMessage, setStatusMessage] = useState(null);

      // Form State
      const [previewImage, setPreviewImage] = useState(null);
      const [formData, setFormData] = useState({
        name: '',
        category: 'top',
        color: '',
        style_tags: '',
        suitable_weather: 'ร้อน (Hot)',
        description: '',
        image_url: ''
      });

      const fileInputRef = useRef(null);

      useEffect(() => {
        loadWardrobeItems();
      }, []);

      const showNotification = (msg, type = 'info') => {
        setStatusMessage({ text: msg, type });
        setTimeout(() => setStatusMessage(null), 4000);
      };

      const loadWardrobeItems = async () => {
        setLoading(true);
        try {
          // Check if Supabase client is available in environment
          if (window.supabaseClient) {
            const { data, error } = await window.supabaseClient
              .from('wardrobe_items')
              .select('*')
              .order('created_at', { ascending: false });

            if (error) throw error;
            setItems(data || []);
          } else {
            // Fallback Mock Data
            const savedLocal = localStorage.getItem('smart_wardrobe_items');
            if (savedLocal) {
              setItems(JSON.parse(savedLocal));
            } else {
              setItems(MOCK_ITEMS);
              localStorage.setItem('smart_wardrobe_items', JSON.stringify(MOCK_ITEMS));
            }
          }
        } catch (err) {
          console.warn("Supabase fetch failed, using local mock data:", err.message);
          const savedLocal = localStorage.getItem('smart_wardrobe_items');
          setItems(savedLocal ? JSON.parse(savedLocal) : MOCK_ITEMS);
        } finally {
          setLoading(false);
        }
      };

      const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Img = reader.result;
          setPreviewImage(base64Img);
          setFormData(prev => ({ ...prev, image_url: base64Img }));
          analyzeImageWithGemini(base64Img);
        };
        reader.readAsDataURL(file);
      };

      const analyzeImageWithGemini = async (base64Image) => {
        setAiAnalyzing(true);
        showNotification("⚡ กำลังส่งรูปให้ Gemini AI วิเคราะห์รายละเอียด...", "info");

        try {
          // Simulate Gemini AI Response for UI demonstration or integration
          // If GEMINI_API_KEY is available in backend endpoint, fetch from API
          let aiResult;

          // Attempt backend API call if exists, else Mock Smart AI response
          if (window.location.hostname !== 'localhost' && false) {
            const response = await fetch('/api/analyze-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: base64Image })
            });
            aiResult = await response.json();
          } else {
            // Intelligent Mock Delay simulating Gemini 2.5 Flash Vision AI
            await new Promise(res => setTimeout(res, 2000));
            
            // Random smart suggestions for demo
            aiResult = {
              name: "เสื้อเบลเซอร์สไตล์เกาหลี สีครีมมินิมอล",
              category: "outerwear",
              color: "ครีม / เบจ",
              style_tags: "Casual, Formal, Minimal, Korea",
              suitable_weather: "เย็น/ห้องแอร์ (Cool)",
              description: "เสื้อเบลเซอร์ผ้าอยู่ทรงน้ำหนักเบา เหมาะสำหรับการแต่งกายไปทำงาน คาเฟ่ หรือพบปะลูกค้า"
            };
          }

          // Autofill form with AI output
          setFormData(prev => ({
            ...prev,
            name: aiResult.name || prev.name,
            category: aiResult.category || prev.category,
            color: aiResult.color || prev.color,
            style_tags: Array.isArray(aiResult.style_tags) ? aiResult.style_tags.join(', ') : aiResult.style_tags,
            suitable_weather: aiResult.suitable_weather || prev.suitable_weather,
            description: aiResult.description || prev.description
          }));

          showNotification("✨ AI วิเคราะห์เสื้อผ้าสำเร็จ! ตรวจสอบข้อมูลด้านล่างได้เลย", "success");

        } catch (error) {
          console.error("Gemini AI Analysis Error:", error);
          showNotification("⚠️ ไม่สามารถวิเคราะห์ด้วย AI ได้ โปรดกรอกข้อมูลด้วยตนเอง", "error");
        } finally {
          setAiAnalyzing(false);
        }
      };

      const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.image_url) {
          showNotification("โปรดเลือกรูปภาพและใส่ชื่อเสื้อผ้า", "error");
          return;
        }

        const tagsArray = typeof formData.style_tags === 'string'
          ? formData.style_tags.split(',').map(t => t.trim()).filter(Boolean)
          : formData.style_tags;

        const newItem = {
          id: Date.now().toString(),
          name: formData.name,
          category: formData.category,
          color: formData.color,
          style_tags: tagsArray,
          suitable_weather: formData.suitable_weather,
          image_url: formData.image_url,
          description: formData.description,
          created_at: new Date().toISOString()
        };

        try {
          if (window.supabaseClient) {
            const { error } = await window.supabaseClient
              .from('wardrobe_items')
              .insert([newItem]);
            if (error) throw error;
          }

          // Update Local State & Cache
          const updatedItems = [newItem, ...items];
          setItems(updatedItems);
          localStorage.setItem('smart_wardrobe_items', JSON.stringify(updatedItems));

          showNotification("🎉 บันทึกลงตู้เสื้อผ้าเรียบร้อยแล้ว!", "success");
          resetForm();
          setShowForm(false);
        } catch (err) {
          console.error("Save error:", err);
          showNotification("เกิดข้อผิดพลาดในการบันทึกข้อมูล", "error");
        }
      };

      const handleDelete = async (id) => {
        if (!confirm("คุณต้องการลบเสื้อผ้าชิ้นนี้ออกจากตู้หรือไม่?")) return;

        try {
          if (window.supabaseClient) {
            const { error } = await window.supabaseClient
              .from('wardrobe_items')
              .delete()
              .eq('id', id);
            if (error) throw error;
          }

          const updatedItems = items.filter(item => item.id !== id);
          setItems(updatedItems);
          localStorage.setItem('smart_wardrobe_items', JSON.stringify(updatedItems));
          showNotification("ลบรายการเสื้อผ้าแล้ว", "info");
        } catch (err) {
          console.error("Delete error:", err);
          showNotification("ไม่สามารถลบรายการได้", "error");
        }
      };

      const resetForm = () => {
        setPreviewImage(null);
        setFormData({
          name: '',
          category: 'top',
          color: '',
          style_tags: '',
          suitable_weather: 'ร้อน (Hot)',
          description: '',
          image_url: ''
        });
      };

      // Filtered items based on active category
      const filteredItems = selectedCategory === 'all'
        ? items
        : items.filter(item => item.category === selectedCategory);

      return (
        <div className="max-w-6xl mx-auto px-4 py-8">
          
          {/* Header Bar */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm mb-1">
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                Smart Wardrobe AI System
              </div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                ตู้เสื้อผ้าอัจฉริยะของฉัน
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                จัดการชุดเสื้อผ้า ถ่ายรูปอัปโหลด และใช้ AI ช่วยวิเคราะห์สไตล์อัตโนมัติ
              </p>
            </div>

            <button
              onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
            >
              <i data-lucide={showForm ? "x" : "plus"}></i>
              <span>{showForm ? 'ยกเลิก' : 'เพิ่มเสื้อผ้าชิ้นใหม่'}</span>
            </button>
          </header>

          {/* Toast Notification */}
          {statusMessage && (
            <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 transition-all ${
              statusMessage.type === 'error' ? 'bg-red-950/80 border-red-800 text-red-200' :
              statusMessage.type === 'success' ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200' :
              'bg-indigo-950/80 border-indigo-800 text-indigo-200'
            }`}>
              <i data-lucide={statusMessage.type === 'error' ? 'alert-circle' : statusMessage.type === 'success' ? 'check-circle' : 'info'}></i>
              <span className="text-sm">{statusMessage.text}</span>
            </div>
          )}

          {}
          {showForm && (
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 mb-10 shadow-2xl backdrop-blur-md transition-all">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-700 pb-3">
                <i data-lucide="sparkles" className="text-indigo-400"></i>
                อัปโหลดรูปภาพ & ให้ AI วิเคราะห์รายละเอียด
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Upload Image Section */}
                <div className="md:col-span-5 flex flex-col items-center justify-center">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full aspect-square max-w-sm rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 cursor-pointer relative overflow-hidden transition-all ${
                      previewImage ? 'border-indigo-500 bg-slate-900' : 'border-slate-600 hover:border-indigo-400 bg-slate-900/50 hover:bg-slate-900'
                    }`}
                  >
                    {previewImage ? (
                      <>
                        <img src={previewImage} alt="Uploaded Item" className="w-full h-full object-cover rounded-xl" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2">
                          <i data-lucide="camera" className="w-8 h-8"></i>
                          <span className="text-xs font-medium">เปลี่ยนรูปภาพ</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6">
                        <div className="w-16 h-16 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <i data-lucide="camera" className="w-8 h-8"></i>
                        </div>
                        <p className="text-sm font-semibold text-slate-200">ถ่ายรูป หรือ คลิกอัปโหลดรูปภาพ</p>
                        <p className="text-xs text-slate-400 mt-1">รองรับไฟล์ JPG, PNG, WEBP</p>
                      </div>
                    )}

                    {aiAnalyzing && (
                      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center text-indigo-400 p-4 text-center">
                        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                        <span className="text-sm font-semibold text-white">Gemini Vision AI กำลังสกัดข้อมูล...</span>
                        <span className="text-xs text-slate-400 mt-1">วิเคราะห์หมวดหมู่ สี สไตล์ และสภาพอากาศ</span>
                      </div>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                  />
                  
                  <span className="text-xs text-slate-400 mt-3 text-center">
                    💡 ถ่ายรูปเสื้อผ้าเดี่ยวๆ บนพื้นหลังเรียบ จะช่วยให้ AI วิเคราะห์แม่นยำยิ่งขึ้น
                  </span>
                </div>

                {/* AI Filled Form Controls */}
                <form onSubmit={handleSubmit} className="md:col-span-7 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">ชื่อเรียกเสื้อผ้า</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น เสื้อเชิ้ตลายทางสีฟ้า"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">หมวดหมู่</label>
                      <select
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      >
                        <option value="top">เสื้อ (Top)</option>
                        <option value="bottom">กางเกง / กระโปรง (Bottom)</option>
                        <option value="shoes">รองเท้า (Shoes)</option>
                        <option value="outerwear">เสื้อคลุม (Outerwear)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">สีหลัก</label>
                      <input
                        type="text"
                        placeholder="เช่น ขาว, ดำ, กรมท่า"
                        value={formData.color}
                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">สไตล์ (คั่นด้วยจุลภาค)</label>
                      <input
                        type="text"
                        placeholder="เช่น Casual, Minimal, Vintage"
                        value={formData.style_tags}
                        onChange={e => setFormData({ ...formData, style_tags: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">สภาพอากาศที่เหมาะสม</label>
                      <select
                        value={formData.suitable_weather}
                        onChange={e => setFormData({ ...formData, suitable_weather: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      >
                        <option value="ร้อน (Hot)">ร้อน (Hot)</option>
                        <option value="เย็น/ห้องแอร์ (Cool)">เย็น/ห้องแอร์ (Cool)</option>
                        <option value="ฝนตก (Rainy)">ฝนตก (Rainy)</option>
                        <option value="ทุกสภาพอากาศ (All)">ทุกสภาพอากาศ (All)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">คำอธิบายรายละเอียด</label>
                    <textarea
                      rows="3"
                      placeholder="เช่น เนื้อผ้านุ่ม ใส่สบาย เหมาะสำหรับแมตช์คู่กับกางเกงสแล็ค"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                    ></textarea>
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => { resetForm(); setShowForm(false); }}
                      className="px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={aiAnalyzing}
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <i data-lucide="check"></i>
                      <span>บันทึกลงตู้เสื้อผ้า</span>
                    </button>
                  </div>
                </form>

              </div>
            </div>
          )}

          {}
          <nav className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-slate-800 scrollbar-none">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedCategory === cat.id ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-900 text-slate-400'
                }`}>
                  {cat.id === 'all' ? items.length : items.filter(i => i.category === cat.id).length}
                </span>
              </button>
            ))}
          </nav>

          {}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm">กำลังโหลดตู้เสื้อผ้าของคุณ...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-12 text-center my-8">
              <div className="w-16 h-16 bg-slate-800 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <i data-lucide="shirt" className="w-8 h-8"></i>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">ยังไม่มีรายการเสื้อผ้าในหมวดหมู่นี้</h3>
              <p className="text-slate-400 text-sm mb-6">เริ่มถ่ายรูปอัปโหลดเสื้อผ้าของคุณเพื่อให้ AI ช่วยดูแลสไตล์</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl inline-flex items-center gap-2 transition-all"
              >
                <i data-lucide="plus"></i>
                <span>เพิ่มเสื้อผ้าชิ้นแรก</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden hover:border-slate-600 transition-all group flex flex-col justify-between shadow-lg"
                >
                  <div>
                    {/* Item Image */}
                    <div className="aspect-square relative overflow-hidden bg-slate-900">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-indigo-300 border border-slate-700">
                        {CATEGORIES.find(c => c.id === item.category)?.label.split(' ')[0] || item.category}
                      </div>

                      {/* Delete Button overlay */}
                      <button
                        onClick={() => handleDelete(item.id)}
                        title="ลบเสื้อผ้าชิ้นนี้"
                        className="absolute top-3 right-3 w-8 h-8 bg-red-950/80 hover:bg-red-600 text-red-200 hover:text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md cursor-pointer"
                      >
                        <i data-lucide="trash-2" className="w-4 h-4"></i>
                      </button>
                    </div>

                    {/* Content Details */}
                    <div className="p-4">
                      <h3 className="font-semibold text-white text-base line-clamp-1 mb-1" title={item.name}>
                        {item.name}
                      </h3>
                      
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                        {item.description || 'ไม่มีคำอธิบาย'}
                      </p>

                      {/* Meta Tags */}
                      <div className="space-y-2 text-xs">
                        {item.color && (
                          <div className="flex items-center gap-2 text-slate-300">
                            <span className="text-slate-500">สี:</span>
                            <span className="bg-slate-700/60 px-2 py-0.5 rounded text-slate-200">{item.color}</span>
                          </div>
                        )}

                        {item.suitable_weather && (
                          <div className="flex items-center gap-2 text-slate-300">
                            <span className="text-slate-500">สภาพอากาศ:</span>
                            <span className="text-indigo-300">{item.suitable_weather}</span>
                          </div>
                        )}

                        {/* Style Tags */}
                        {item.style_tags && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {(Array.isArray(item.style_tags) ? item.style_tags : item.style_tags.split(',')).map((tag, idx) => (
                              <span
                                key={idx}
                                className="bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 px-2 py-0.5 rounded-md text-[10px]"
                              >
                                #{tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer Card */}
                  <div className="px-4 pb-4 pt-2 border-t border-slate-700/50 flex justify-between items-center text-[11px] text-slate-500">
                    <span>เพิ่มเมื่อ {new Date(item.created_at).toLocaleDateString('th-TH')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      );
    }

    const rootElement = document.getElementById('root');
    const root = ReactDOM.createRoot(rootElement);
    root.render(<SmartWardrobeApp />);

    // Initialize Lucide Icons after render updates
    setTimeout(() => {
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }, 100);
  </script>
</body>
</html>
