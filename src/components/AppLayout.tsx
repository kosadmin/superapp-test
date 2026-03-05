'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const NAV_ITEMS = [
  { href: '/dashboard',  icon: '⊞',  label: 'Dashboard' },
  { href: '/candidates', icon: '👤', label: 'Ứng viên' },
  { href: '/warranty',   icon: '🛡️', label: 'OB & Bảo hành' },
  // Thêm module mới vào đây sau
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { name, user_group, user_id } = useAuth();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100">

      {/* TOP BAR */}
      <header className="flex-shrink-0 h-12 bg-white border-b flex items-center px-4 gap-4 z-50 shadow-sm">
        {/* Logo */}
        <div className="flex items-center gap-1.5 font-black text-sm select-none">
          <span className="text-orange-500">✕ KOS</span>
          <span className="bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md tracking-widest">SUPERAPP</span>
        </div>

        {/* Tên module hiện tại */}
        <div className="h-5 w-px bg-gray-200" />
        <span className="text-sm font-bold text-gray-700">
          {NAV_ITEMS.find(n => pathname.startsWith(n.href))?.label ?? 'KOS'}
        </span>

        <div className="flex-1" />

        {/* Notification bell — link tới trang thông báo nếu có */}
        <button className="relative p-2 text-gray-400 hover:text-orange-500 transition">
          🔔
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Profile */}
        <Link href="/profile" className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-gray-50 transition">
<div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-orange-200">
  <svg viewBox="0 0 36 36" fill="none" className="w-full h-full">
    <circle cx="18" cy="18" r="18" fill="#fff7ed"/>
    <circle cx="18" cy="14" r="6" fill="#fdba74"/>
    <ellipse cx="18" cy="27" rx="10" ry="6" fill="#fdba74"/>
  </svg>
</div>
          <div className="leading-tight">
            <div className="text-xs font-bold text-gray-800 leading-none">{name}</div>
            <div className="text-[10px] text-gray-400">{user_group}</div>
          </div>
        </Link>
      </header>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">

        {/* SIDEBAR NAV */}
        <nav className="flex-shrink-0 w-14 bg-white border-r flex flex-col items-center py-3 gap-1 z-40">
          {NAV_ITEMS.map(item => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} title={item.label}
                className={`group relative flex flex-col items-center justify-center w-10 h-10 rounded-xl transition-all
                  ${isActive
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-100'
                    : 'text-gray-400 hover:bg-orange-50 hover:text-orange-500'}`}>
                <span className="text-lg leading-none">{item.icon}</span>
                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-[10px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-50 shadow-lg">
                  {item.label}
                </div>
              </Link>
            );
          })}

          <div className="flex-1" />

          {/* Đăng xuất */}
          <Link href="/logout" title="Đăng xuất"
            className="group relative flex flex-col items-center justify-center w-10 h-10 rounded-xl text-gray-300 hover:bg-red-50 hover:text-red-400 transition">
            <span className="text-lg">⏻</span>
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-[10px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-50 shadow-lg">
              Đăng xuất
            </div>
          </Link>
        </nav>

        {/* NỘI DUNG TRANG */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>

      </div>
    </div>
  );
}
