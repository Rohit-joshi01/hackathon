import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

const protectedRoutes = ['/dashboard'];
const publicOnlyRoutes = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isPublicOnlyRoute = publicOnlyRoutes.some((route) => pathname.startsWith(route));

  // Extract token from cookie
  const token = request.cookies.get('auth_token')?.value;
  const verifiedToken = await verifyToken(token);

  // If trying to access protected route without valid token
  if (isProtectedRoute && !verifiedToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If trying to access login/signup while already authenticated
  if (isPublicOnlyRoute && verifiedToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
