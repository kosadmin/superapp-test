'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    href: '/candidates',
    label: 'Ứng viên',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
  {
    href: '/warranty',
    label: 'OB & Bảo hành',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 3l8 4v5c0 4.5-3.4 8.7-8 10C7.4 20.7 4 16.5 4 12V7l8-4z"/>
      </svg>
    ),
  },
  {
    href: '/projects',
    label: 'Dự án',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
];

const LOGOUT_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const AvatarIcon = () => (
  <svg viewBox="0 0 36 36" fill="none" className="w-full h-full">
    <circle cx="18" cy="18" r="18" fill="#fff7ed"/>
    <circle cx="18" cy="14" r="6" fill="#fdba74"/>
    <ellipse cx="18" cy="27" rx="10" ry="6" fill="#fdba74"/>
  </svg>
);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { name, user_group } = useAuth();
  const activeLabel = NAV_ITEMS.find(n => pathname.startsWith(n.href))?.label ?? 'KOS';

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100">

      {/* TOP BAR */}
      <header className="flex-shrink-0 h-12 bg-white border-b flex items-center px-4 gap-4 z-50 shadow-sm">

        {/* Logo — luôn hiện */}
        <Link href="/dashboard" className="flex-shrink-0">
          <Image src="/logo.png" alt="Logo" width={80} height={32} className="object-contain h-8 w-auto" />
        </Link>

        <div className="h-6 w-px bg-gray-200 flex-shrink-0" />

        {/* Tên module — ẩn trên mobile */}
        <span className="hidden sm:block text-base font-bold uppercase tracking-wide text-orange-500">
          {activeLabel}
        </span>

        <div className="flex-1" />

        {/* Profile — chỉ avatar trên mobile, đầy đủ trên desktop */}
        <Link href="/profile" className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-gray-50 transition">
          <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-orange-200">
            <AvatarIcon />
          </div>
          {/* Tên + nhóm — ẩn trên mobile */}
          <div className="leading-tight hidden sm:block">
            <div className="text-xs font-bold text-gray-800 leading-none">{name}</div>
            <div className="text-[10px] text-gray-400">{user_group}</div>
          </div>
        </Link>
      </header>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">

        {/* SIDEBAR NAV — chỉ hiện trên desktop (sm trở lên) */}
        <nav className="flex-shrink-0 w-14 bg-white border-r flex-col items-center z-40 hidden sm:flex">
          {NAV_ITEMS.map(item => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} title={item.label}
                className={`group relative flex items-center justify-center w-14 h-14 transition-all
                  ${isActive ? 'bg-orange-500 text-white' : 'text-orange-500 bg-white hover:bg-orange-50'}`}>
                {item.icon}
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
            className="group relative flex items-center justify-center w-14 h-14 text-red-400 hover:bg-red-50 hover:text-red-500 transition">
            {LOGOUT_ICON}
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-[10px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-50 shadow-lg">
              Đăng xuất
            </div>
          </Link>
        </nav>

        {/* NỘI DUNG TRANG */}
        {/* Trên mobile cần padding-bottom để tránh bị che bởi bottom bar */}
        <main className="flex-1 overflow-hidden pb-16 sm:pb-0">
          {children}
        </main>

      </div>

      {/* BOTTOM NAV BAR — chỉ hiện trên mobile */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-[0_-2px_12px_rgba(0,0,0,0.08)] flex items-stretch">
        {NAV_ITEMS.map(item => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-all
                ${isActive ? 'text-orange-500' : 'text-gray-400 hover:text-orange-400'}`}>
              <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-orange-50' : ''}`}>
                {item.icon}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-tight leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Nút đăng xuất trong bottom bar */}
        <Link href="/logout"
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-red-400 hover:text-red-500 transition-all">
          <div className="p-1 rounded-xl">
            {LOGOUT_ICON}
          </div>
          <span className="text-[9px] font-bold uppercase tracking-tight leading-none">
            Thoát
          </span>
        </Link>
      </nav>

    </div>
  );
}
