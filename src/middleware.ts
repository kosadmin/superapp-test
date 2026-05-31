import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─────────────────────────────────────────────────────────────────────────────
// 🔴 BẬT / TẮT CHẾ ĐỘ BẢO TRÌ
//    true  → toàn bộ app chuyển về /maintenance
//    false → app hoạt động bình thường
// ─────────────────────────────────────────────────────────────────────────────
const MAINTENANCE_MODE = true;

// Các route KHÔNG bị chặn (luôn truy cập được)
const ALLOWED_PATHS = [
  '/maintenance',
  '/_next',
  '/favicon.ico',
  '/logo.png',
  '/templates',
];

export function middleware(request: NextRequest) {
  if (!MAINTENANCE_MODE) return NextResponse.next();

  const { pathname } = request.nextUrl;

  // Cho phép các path đặc biệt đi qua
  if (ALLOWED_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Redirect tất cả còn lại về trang bảo trì
  const maintenanceUrl = new URL('/maintenance', request.url);
  return NextResponse.redirect(maintenanceUrl);
}

export const config = {
  // Áp dụng cho tất cả route, trừ static files và API nội bộ của Next.js
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
