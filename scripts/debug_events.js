const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://oxxnxcuqxluffxshcxvy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_r0jh_ju6yfNyxU-ne5327A_y8qq-_7K';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debugEvents() {
    console.log('🕵️‍♀️ Inspecting restaurant_events table...');

    // 1. Try to fetch one event to see columns
    const { data: events, error: fetchError } = await supabase
        .from('restaurant_events')
        .select('*')
        .limit(1);

    if (fetchError) {
        console.error('❌ Error fetching events:', fetchError);
    } else if (events.length > 0) {
        console.log('✅ Found event. Columns:', Object.keys(events[0]));
    } else {
        console.log('⚠️ No events found. Trying to insert a dummy to probe columns...');

        // 2. Try simple insert without event_type to see if it works
        // IF event_type is required, this might fail or succeed depending on default
        const { data, error: insertError } = await supabase
            .from('restaurant_events')
            .insert([{
                restaurant_id: 'dummy', // This will fail FK probably, but we want to see Schema error first
            }])
            .select();

        if (insertError) {
            console.error('Insert Error Probe:', insertError);
        }
    }
}

debugEvents();
