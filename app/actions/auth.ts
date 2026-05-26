'use server'

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { revalidatePath } from 'next/cache'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback-super-secret-key-1111-menu-platform'
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || 'godmode1111'

// Helper to sign session data
function signSession(dataStr: string): string {
    const signature = crypto.createHmac('sha256', SESSION_SECRET).update(dataStr).digest('hex')
    return `${dataStr}:${signature}`
}

// Helper to verify a signed session string
function verifySignedString(signedStr: string): string | null {
    try {
        const lastColonIndex = signedStr.lastIndexOf(':')
        if (lastColonIndex === -1) return null

        const dataStr = signedStr.substring(0, lastColonIndex)
        const signature = signedStr.substring(lastColonIndex + 1)

        const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(dataStr).digest('hex')
        if (signature === expectedSignature) {
            return dataStr
        }
    } catch (e) {
        console.error('Error verifying signature:', e)
    }
    return null
}

// --- CLIENT ADMIN SESSIONS ---

export async function loginAdmin(slug: string, passwordInput: string) {
    try {
        const { data, error } = await supabase
            .from('restaurants')
            .select('id, admin_password')
            .eq('slug', slug)
            .single()

        if (error || !data) {
            return { success: false, error: 'Restaurante no encontrado' }
        }

        if (!data.admin_password) {
            return { success: false, error: 'Este restaurante no tiene contraseña configurada. Por favor, contacta al administrador de la plataforma.' }
        }

        if (data.admin_password !== passwordInput) {
            return { success: false, error: 'Contraseña incorrecta' }
        }

        const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 days
        const dataStr = `${data.id}:${slug}:${expiresAt}`
        const sessionVal = signSession(dataStr)

        const cookieStore = await cookies()
        cookieStore.set(`admin_session_${slug}`, sessionVal, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        })

        return { success: true }
    } catch (error: any) {
        console.error('Login action error:', error)
        return { success: false, error: 'Error del servidor al iniciar sesión' }
    }
}

export async function logoutAdmin(slug: string) {
    const cookieStore = await cookies()
    cookieStore.delete(`admin_session_${slug}`)
    return { success: true }
}

export async function verifySession(slug: string): Promise<{ restaurantId: string; slug: string } | null> {
    try {
        const cookieStore = await cookies()
        const cookieName = `admin_session_${slug}`
        const cookieValue = cookieStore.get(cookieName)?.value

        if (!cookieValue) return null

        const verifiedData = verifySignedString(cookieValue)
        if (!verifiedData) return null

        const [restaurantId, cookieSlug, expiresAtStr] = verifiedData.split(':')
        if (cookieSlug !== slug) return null

        const expiresAt = parseInt(expiresAtStr, 10)
        if (Date.now() > expiresAt) return null

        return { restaurantId, slug: cookieSlug }
    } catch (e) {
        console.error('Session verification error:', e)
    }
    return null
}

// --- SUPER ADMIN SESSIONS ---

export async function loginSuperAdmin(passwordInput: string) {
    try {
        if (passwordInput !== SUPERADMIN_PASSWORD) {
            return { success: false, error: 'Contraseña maestra incorrecta' }
        }

        const expiresAt = Date.now() + 1000 * 60 * 60 * 24 // 24 hours
        const dataStr = `superadmin:${expiresAt}`
        const sessionVal = signSession(dataStr)

        const cookieStore = await cookies()
        cookieStore.set('superadmin_session', sessionVal, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24 hours
            path: '/',
        })

        return { success: true }
    } catch (error) {
        console.error('Super-admin login error:', error)
        return { success: false, error: 'Error del servidor al iniciar sesión maestra' }
    }
}

export async function logoutSuperAdmin() {
    const cookieStore = await cookies()
    cookieStore.delete('superadmin_session')
    return { success: true }
}

export async function verifySuperAdminSession(): Promise<boolean> {
    try {
        const cookieStore = await cookies()
        const cookieValue = cookieStore.get('superadmin_session')?.value

        if (!cookieValue) return false

        const verifiedData = verifySignedString(cookieValue)
        if (!verifiedData) return false

        const [role, expiresAtStr] = verifiedData.split(':')
        if (role !== 'superadmin') return false

        const expiresAt = parseInt(expiresAtStr, 10)
        if (Date.now() > expiresAt) return false

        return true
    } catch (e) {
        console.error('Superadmin session verification error:', e)
    }
    return false
}

// --- SUPER ADMIN ACTIONS ---

export async function getAllRestaurantsForSuperAdmin() {
    const isSuperAdmin = await verifySuperAdminSession()
    if (!isSuperAdmin) {
        throw new Error('No autorizado')
    }

    try {
        // Query restaurants from Supabase
        const { data, error } = await supabase
            .from('restaurants')
            .select('id, name, slug, admin_password, custom_domain, theme_color, created_at')
            .order('name', { ascending: true })

        if (error) throw error
        return { success: true, restaurants: data || [] }
    } catch (error: any) {
        console.error('Superadmin get restaurants error:', error)
        return { success: false, error: error.message }
    }
}

export async function updateRestaurantPassword(restaurantId: string, slug: string, newPassword: string) {
    const isSuperAdmin = await verifySuperAdminSession()
    if (!isSuperAdmin) {
        throw new Error('No autorizado')
    }

    try {
        const { error } = await supabase
            .from('restaurants')
            .update({ admin_password: newPassword || null }) // null deletes the password if empty
            .eq('id', restaurantId)

        if (error) throw error

        // Revalidate the admin and public pages for this restaurant
        revalidatePath(`/${slug}`)
        revalidatePath(`/${slug}/admin`)

        return { success: true }
    } catch (error: any) {
        console.error('Superadmin update password error:', error)
        return { success: false, error: error.message }
    }
}

export async function updateRestaurantCustomDomain(restaurantId: string, slug: string, customDomain: string) {
    const isSuperAdmin = await verifySuperAdminSession()
    if (!isSuperAdmin) {
        throw new Error('No autorizado')
    }

    try {
        const { error } = await supabase
            .from('restaurants')
            .update({ custom_domain: customDomain || null })
            .eq('id', restaurantId)

        if (error) throw error

        revalidatePath(`/${slug}`)
        revalidatePath(`/${slug}/admin`)

        return { success: true }
    } catch (error: any) {
        console.error('Superadmin update domain error:', error)
        return { success: false, error: error.message }
    }
}

export async function deleteRestaurant(restaurantId: string, slug: string) {
    const isSuperAdmin = await verifySuperAdminSession()
    if (!isSuperAdmin) {
        throw new Error('No autorizado')
    }

    try {
        const { error } = await supabase
            .from('restaurants')
            .delete()
            .eq('id', restaurantId)

        if (error) throw error

        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        console.error('Superadmin delete restaurant error:', error)
        return { success: false, error: error.message }
    }
}

export async function createRestaurant(name: string, slug: string, password?: string) {
    const isSuperAdmin = await verifySuperAdminSession()
    if (!isSuperAdmin) {
        throw new Error('No autorizado')
    }

    try {
        const { data, error } = await supabase
            .from('restaurants')
            .insert({
                name,
                slug: slug.toLowerCase().trim(),
                admin_password: password || null,
                theme_color: '#FFB800'
            })
            .select()
            .single()

        if (error) throw error

        return { success: true, restaurant: data }
    } catch (error: any) {
        console.error('Superadmin create restaurant error:', error)
        return { success: false, error: error.message }
    }
}
