// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

// Các trang cần phải đăng nhập mới được vào
const protectedRoutes = ['/candidates', '/profile'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Kiểm tra xem có đang truy cập vào route bảo vệ không
  const isProtected = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Kiểm tra token trong localStorage? → Không được ở server
  // → Dùng cookie thay vì localStorage (Next.js middleware chạy ở server)
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    // Chưa đăng nhập → đẩy về login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname); // nhớ đường dẫn để quay lại sau
    return NextResponse.redirect(loginUrl);
  }

  // Đã đăng nhập → cho qua
  return NextResponse.next();
}

export const config = {
  matcher: ['/candidates/:path*', '/profile'],
};
