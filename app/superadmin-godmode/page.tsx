import { verifySuperAdminSession, getAllRestaurantsForSuperAdmin } from '../actions/auth'
import SuperAdminLoginForm from './SuperAdminLoginForm'
import SuperAdminDashboardClient from './SuperAdminDashboardClient'

export const dynamic = 'force-dynamic'

export default async function SuperAdminGodmodePage() {
    // 1. Verify session server-side
    const isAuthorized = await verifySuperAdminSession()

    if (!isAuthorized) {
        return <SuperAdminLoginForm />
    }

    // 2. Fetch all restaurants server-side if authorized
    const res = await getAllRestaurantsForSuperAdmin()

    if (!res.success || !res.restaurants) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white font-sans">
                <h1 className="text-4xl font-bold mb-2 text-red-500">Error</h1>
                <p className="text-neutral-400">No se pudieron cargar los restaurantes de la plataforma.</p>
                <pre className="text-xs text-neutral-600 mt-4 bg-neutral-900 p-4 rounded-xl">
                    {res.error || 'Unknown database retrieval error'}
                </pre>
            </div>
        )
    }

    return <SuperAdminDashboardClient initialRestaurants={res.restaurants} />
}
