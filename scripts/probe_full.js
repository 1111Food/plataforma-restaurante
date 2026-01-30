const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://oxxnxcuqxluffxshcxvy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_r0jh_ju6yfNyxU-ne5327A_y8qq-_7K';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function probeFull() {
    const { data: restaurant } = await supabase.from('restaurants').select('id').eq('slug', 'prueba').single();
    if (!restaurant) return console.log('No restaurant');

    const payload = {
        restaurant_id: restaurant.id,
        title: 'Full Probe',
        event_type: 'Social',
        pax_count: 10,
        duration_hours: 2,
        // event_date: null, // Test without date first
        // image_url: null
    };

    console.log('Inserting payload:', payload);
    const { data, error } = await supabase.from('restaurant_events').insert([payload]).select();

    if (error) {
        console.log('Full Insert FAILED:', error.message, error.details, error.hint);
    } else {
        console.log('Full Insert SUCCESS:', data);
    }
}

probeFull();
