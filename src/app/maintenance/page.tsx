'use client';

import { useEffect, useState } from 'react';

export default function MaintenancePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 overflow-hidden relative"
      style={{ background: '#fafaf8', fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Warm blobs */}
      <div className="absolute top-[-80px] right-[-60px] w-[380px] h-[380px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,140,51,0.12) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-80px] left-[-60px] w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,106,0,0.09) 0%, transparent 70%)' }} />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-[440px] text-center"
        style={{
          background: '#ffffff',
          border: '1px solid #e8e4df',
          borderRadius: 20,
          padding: '48px 40px 40px',
          boxShadow: '0 4px 32px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        {/* Brand */}
        <div className="flex items-center justify-center mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="KOS"
            className="h-8 w-auto"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-7">
          <div
            style={{
              width: 72, height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #fff2e5, #ffdfc0)',
              border: '1px solid #ffbf86',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#ff6a00" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" width={32} height={32}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1614', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 10 }}>
          Hệ thống tạm ngưng
        </h1>

        {/* Badge */}
        <div className="flex justify-center mb-7">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#fff2e5', border: '1px solid #ffbf86',
            borderRadius: 999, padding: '4px 12px',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: '#ff6a00',
              animation: 'pulse-dot 1.8s ease-in-out infinite',
              display: 'inline-block',
            }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#ff6a00' }}>
              Đang bảo trì
            </span>
          </div>
        </div>

        {/* Message */}
        <p style={{ fontSize: 14, lineHeight: 1.65, color: '#7a726a', marginBottom: 28 }}>
          Chúng tôi đang thực hiện nâng cấp hệ thống để mang đến trải nghiệm tốt hơn. Vui lòng quay lại sau.
        </p>

        {/* Info list */}
        <div style={{ borderTop: '1px solid #f0ebe5', paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
          {[
            { icon: '🔧', label: 'Lý do', value: 'Nâng cấp & bảo trì hệ thống' },
            { icon: '📅', label: 'Dự kiến hoạt động lại', value: 'Sẽ được thông báo qua Zalo' },
            { icon: '📞', label: 'Liên hệ hỗ trợ', value: 'Bộ phận IT — KOS Outsourcing' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ fontSize: 16, lineHeight: 1, marginTop: 1, flexShrink: 0 }}>{item.icon}</span>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#c5bdb5', display: 'block', marginBottom: 2 }}>
                  {item.label}
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 500, color: '#3a3330' }}>{item.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p style={{ marginTop: 36, fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#cec8c2' }}>
          © {mounted ? new Date().getFullYear() : '2025'} KOS Outsourcing · All rights reserved
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.45; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}
