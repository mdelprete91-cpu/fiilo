import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
  const isPlatformPage = pathname.startsWith('/platform')
  const isDashboardPage = pathname.startsWith('/dashboard')
  const isCustomerArea = pathname.startsWith('/c/')

  // Le route customer del tipo /c/[slug]/login e /c/[slug]/invite/[token]
  // devono essere accessibili anche senza sessione.
  const isCustomerPublic =
    isCustomerArea &&
    (/^\/c\/[^/]+\/login(?:\/|$)/.test(pathname) ||
      /^\/c\/[^/]+\/invite\/[^/]+$/.test(pathname))

  const isProtected = isPlatformPage || isDashboardPage || (isCustomerArea && !isCustomerPublic)

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    // Se il cliente atterra su una route customer senza sessione, mandalo al
    // login del SUO sarto preservando lo slug.
    if (isCustomerArea) {
      const slug = pathname.split('/')[2]
      url.pathname = slug ? `/c/${slug}/login` : '/login'
    } else {
      url.pathname = '/login'
    }
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    // Redirigi alla root: src/app/page.tsx ha la logica role-based che
    // smista platform_owner → /platform, tenant → /dashboard.
    // Mandare direttamente a /dashboard creava loop per i platform_owner,
    // perché /dashboard rifiuta il loro ruolo e rimanda a /login.
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Cross-area gating: customer_end_user non può entrare in dashboard/platform;
  // tenant_* non può entrare nell'area customer (eccetto le pagine pubbliche).
  if (user) {
    // Leggiamo il primo ruolo dell'utente. Stessa query usata in session.ts
    // (ordine asc) per coerenza.
    const { data: roleRow } = await supabase
      .from('user_tenant_roles')
      .select('role')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    const role = roleRow?.role as string | undefined

    if (role === 'customer_end_user' && (isDashboardPage || isPlatformPage)) {
      // I clienti non hanno accesso alle aree gestionali.
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    if (
      role &&
      (role === 'tenant_admin' || role === 'tenant_staff' || role === 'platform_owner') &&
      isCustomerArea &&
      !isCustomerPublic
    ) {
      // Lo staff non deve vedere il portale cliente — confusione UX e
      // contesto sbagliato. Lo mandiamo alla landing role-aware.
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
