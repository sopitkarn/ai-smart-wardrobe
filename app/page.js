import Link from 'next/link';
import { Sparkles, Shirt, Wand2 } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center space-y-8">
        
        {/* Header Section */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-sm font-semibold border border-indigo-100">
            <Sparkles className="w-4 h-4" /> Smart Wardrobe AI
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            AI ช่วยแต่งตัวจากเสื้อผ้าที่มีจริง
          </h1>
          <p className="text-lg text-slate-600 max-w-lg mx-auto">
            บริหารจัดการตู้เสื้อผ้าของคุณ และให้ AI ช่วยเลือกแมตช์ชุดที่ใช่สำหรับทุกโอกาส
          </p>
        </div>

        {/* Action Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
          <Link 
            href="/wardrobe" 
            className="group relative bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-500 transition-all text-left flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Shirt className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">ตู้เสื้อผ้าของฉัน</h2>
              <p className="text-slate-600 text-sm">
                จัดการ เพิ่ม ลบ หรือดูรายการเสื้อผ้าทั้งหมดที่คุณมีอยู่ในระบบ
              </p>
            </div>
            <span className="mt-6 text-sm font-semibold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              ไปที่ตู้เสื้อผ้า &rarr;
            </span>
          </Link>

          <Link 
            href="/match" 
            className="group relative bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl p-6 shadow-md hover:shadow-lg hover:from-indigo-500 hover:to-violet-500 transition-all text-left flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 bg-white/20 text-white rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform backdrop-blur-sm">
                <Wand2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold mb-2">ให้ AI จัดชุดวันนี้</h2>
              <p className="text-indigo-100 text-sm">
                พิมพ์บอกสไตล์ สภาพอากาศ หรือโอกาสที่ต้องไป แล้วให้ AI ช่วยแนะนำชุดที่ดีที่สุด
              </p>
            </div>
            <span className="mt-6 text-sm font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              เริ่มแมตช์ชุด &rarr;
            </span>
          </Link>
        </div>

      </div>
    </main>
  );
}
