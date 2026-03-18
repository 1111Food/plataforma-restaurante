import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const url = request.nextUrl
    const hostname = request.headers.get('host') || ''

    // 1. Skip if it's a static file or API route
    if (
        url.pathname.startsWith('/_next') ||
        url.pathname.startsWith('/api') ||
        url.pathname.includes('.')
    ) {
        return NextResponse.next()
    }

    // 2. Identify main domain (e.g., localhost:3011 or vercel.app)
    const isMainDomain = hostname.includes('localhost') || hostname.includes('vercel.app')

    if (isMainDomain) {
        return NextResponse.next()
    }

    // 3. Custom Domain Lookup
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    try {
        const res = await fetch(`${supabaseUrl}/rest/v1/restaurants?custom_domain=eq.${hostname}&select=slug`, {
            headers: {
                'apikey': supabaseKey!,
                'Authorization': `Bearer ${supabaseKey}`
            }
        })
        const data = await res.json()

        if (data && data.length > 0) {
            const slug = data[0].slug
            
            // Loop prevention: skip if already rewritten
            if (url.pathname.startsWith(`/${slug}`)) {
                return NextResponse.next()
            }

            // Transparently rewrite / path to /[slug]/
            return NextResponse.rewrite(new URL(`/${slug}${url.pathname}`, request.url))
        }
    } catch (error) {
        console.error('Middleware Custom Domain Lookup Failed:', error)
    }

    return NextResponse.next()
}

// Optional: Match all paths except explicit ignores
export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
