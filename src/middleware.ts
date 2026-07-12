import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const userRole = req.auth?.user?.role

  // ── Admin routes ──────────────────────────────────────────────────────────
  if (nextUrl.pathname.startsWith('/admin')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // ── Client-gated routes: wizard + preview + dashboard ─────────────────────
  const isClientRoute =
    nextUrl.pathname.startsWith('/wizard') ||
    nextUrl.pathname.startsWith('/preview') ||
    nextUrl.pathname.startsWith('/dashboard')

  if (isClientRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return NextResponse.next()
  }

  // ── Auth pages: redirect already-logged-in users ──────────────────────────
  const isAuthPage =
    nextUrl.pathname === '/login' ||
    nextUrl.pathname === '/signup' ||
    nextUrl.pathname === '/register'

  if (isLoggedIn && isAuthPage) {
    if (userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|uploads|demo-audio|dev).*)',
  ],
}
