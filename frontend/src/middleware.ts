import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Extract the authorization token from the browser cookies
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Allow all internal system asset files, styles, and API calls to pass through
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. If the user is on the login/register page and ALREADY has a token, send them to the dashboard
  if (pathname.startsWith('/login')) {
    if (token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 3. SECURE WALL: If there is no token, completely block access to ALL other paths
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// Configures the middleware execution boundary to scan every single application directory path
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};