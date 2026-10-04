import './globals.css';

export const metadata = {
  title: 'Smart Wardrobe AI',
  description: 'แอปพลิเคชันช่วยจัดชุดแต่งตัวด้วย AI จากเสื้อผ้าที่มีจริง',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
