'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function updateRestaurantSettings(restaurantId: string, slug: string, data: any) {
    console.log('Server Action: Updating restaurant settings...', restaurantId, data)

    try {
        const { error } = await supabase
            .from('restaurants')
            .update(data)
            .eq('id', restaurantId)

        if (error) {
            console.error('Supabase Error:', error)
            throw new Error('Failed to update restaurant settings')
        }

        console.log(`Revalidating path: /${slug}`)
        revalidatePath(`/${slug}`)
        revalidatePath('/') // Optional: Revalidate home if needed

        return { success: true }
    } catch (error) {
        console.error('Server Action Error:', error)
        return { success: false, error }
    }
}
