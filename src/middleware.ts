// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const { pathname } = request.nextUrl

  // Rotas públicas (não precisam autenticação)
  const publicRoutes = ['/', '/api/auth']

  // Verifica se é rota pública
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Permite acesso a rotas públicas
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Redireciona para login se não autenticado
  if (!token) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  // Logout - limpa sessão e redireciona
  if (pathname.startsWith('/logout')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('logout', 'success')
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/painel/:path*',
    '/turmas/:path*',
    '/planodeaulas/:path*',
    '/avaliacoes/:path*',
    '/desempenho/:path*',
    '/logout'
  ]
}