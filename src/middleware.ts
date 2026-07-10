import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const userRole = req.auth?.user?.role

  // Admin routes — require ADMIN role
  if (nextUrl.pathname.startsWith('/admin')) {
    // Exclude /admin/login from credentials check to prevent infinite loop
    if (nextUrl.pathname === '/admin/login') {
      if (isLoggedIn && userRole === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
      return NextResponse.next()
    }

    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Client dashboard / wizard routes — require CLIENT or ADMIN role
  if (nextUrl.pathname.startsWith('/dashboard') || nextUrl.pathname.startsWith('/wizard')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return NextResponse.next()
  }

  // Redirect logged-in clients away from login/register
  if (isLoggedIn && (nextUrl.pathname === '/login' || nextUrl.pathname === '/register')) {
    if (userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|uploads|demo-audio).*)',
  ],
}
