const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://oxxnxcuqxluffxshcxvy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_r0jh_ju6yfNyxU-ne5327A_y8qq-_7K';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function probe() {
    // 1. Get Restaurant ID
    const { data: restaurant } = await supabase.from('restaurants').select('id').eq('slug', 'prueba').single();
    if (!restaurant) { console.error('No restaurant found'); return; }
    console.log('Rest ID:', restaurant.id);

    // 2. Try Insert Minimal
    console.log('--- Probing Minimal ---');
    const { error: err1 } = await supabase.from('restaurant_events').insert([{
        restaurant_id: restaurant.id,
        title: 'Probe Title'
        // No other fields
    }]);
    if (err1) console.log('Minimal failed:', err1.message);
    else console.log('Minimal success!');

    // 3. Try event_type
    console.log('--- Probing event_type ---');
    const { error: err2 } = await supabase.from('restaurant_events').insert([{
        restaurant_id: restaurant.id,
        title: 'Probe Type',
        event_type: 'Social'
    }]);
    if (err2) console.log('event_type failed:', err2.message);
    else console.log('event_type success!');

    // 4. Try type (alternative)
    console.log('--- Probing type ---');
    const { error: err3 } = await supabase.from('restaurant_events').insert([{
        restaurant_id: restaurant.id,
        title: 'Probe Type Alt',
        type: 'Social' // Alternative name
    }]);
    if (err3) console.log('type failed:', err3.message);
    else console.log('type success!');
}

probe();
