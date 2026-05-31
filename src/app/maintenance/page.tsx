'use client';

import { useEffect, useState } from 'react';

export default function MaintenancePage() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => (d.length >= 3 ? '' : d + '.'));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4 overflow-hidden relative">

      {/* Ambient background blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-orange-500/8 blur-[100px] pointer-events-none" />

      {/* Grid texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 max-w-lg w-full text-center space-y-10">

        {/* Logo / Brand */}
        <div className="flex items-center justify-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="KOS"
            className="h-8 w-auto opacity-90 brightness-0 invert"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="text-white/20 text-2xl font-thin select-none">|</span>
          <span className="text-white/40 text-xs font-bold uppercase tracking-[0.3em]">
            Super CRM
          </span>
        </div>

        {/* Main icon */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Outer pulse ring */}
            <div className="absolute inset-[-12px] rounded-full border border-orange-500/20 animate-ping" />
            <div className="absolute inset-[-6px] rounded-full border border-orange-500/30" />

            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 flex items-center justify-center backdrop-blur-sm">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-9 h-9 text-orange-400"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-4">
          <h1
            className="text-4xl sm:text-5xl font-black text-white leading-none tracking-tight"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            Hệ thống tạm ngưng
          </h1>
          <div className="flex items-center justify-center gap-2">
            <div className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-orange-500/50" />
            <span className="text-orange-400 text-xs font-black uppercase tracking-[0.25em]">
              Đang bảo trì
            </span>
            <div className="h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-orange-500/50" />
          </div>
        </div>

        {/* Message card */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 sm:p-8 text-left space-y-4 backdrop-blur-sm">
          <p className="text-white/70 text-sm leading-relaxed">
            Chúng tôi đang thực hiện nâng cấp hệ thống để mang đến trải nghiệm
            tốt hơn. Vui lòng quay lại sau.
          </p>

          <div className="border-t border-white/10 pt-4 space-y-3">
            {[
              { icon: '🔧', label: 'Lý do', value: 'Nâng cấp & bảo trì hệ thống' },
              { icon: '📅', label: 'Dự kiến hoạt động lại', value: 'Sẽ được thông báo qua Zalo' },
              { icon: '📞', label: 'Liên hệ hỗ trợ', value: '0398.312.775' },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-3">
                <span className="text-base leading-none mt-0.5 flex-shrink-0">{item.icon}</span>
                <div>
                  <span className="text-white/30 text-[10px] uppercase font-bold tracking-widest block">
                    {item.label}
                  </span>
                  <span className="text-white/80 text-sm font-medium">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Animated status bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
            <span className="text-white/30">Trạng thái hệ thống</span>
            <span className="text-orange-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse inline-block" />
              Đang xử lý{dots}
            </span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full"
              style={{
                animation: 'progress-slide 2.5s ease-in-out infinite',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <p className="text-white/15 text-[10px] uppercase tracking-[0.2em] font-bold">
          © {new Date().getFullYear()} KOS Outsourcing · All rights reserved
        </p>
      </div>

      {/* Progress animation keyframe */}
      <style jsx>{`
        @keyframes progress-slide {
          0%   { width: 0%;   margin-left: 0%;   }
          40%  { width: 60%;  margin-left: 0%;   }
          60%  { width: 60%;  margin-left: 40%;  }
          100% { width: 0%;   margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}
