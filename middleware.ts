// middleware.ts (phải ở root project)
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Các trang cần bảo vệ
  const protectedPaths = ['/candidates', '/profile'];

  const isProtected = protectedPaths.some(p => path.startsWith(p));

  if (!isProtected) return NextResponse.next();

  // Lấy token từ cookie (không dùng localStorage ở đây được)
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', path); // để quay lại sau khi login
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/candidates/:path*', '/profile/:path*'],
};
