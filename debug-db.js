const { createClient } = require('@supabase/supabase-js');

// Load env vars manually or hardcode for test if safe (better to use process.env from command line)
// I will expect environment variables to be loaded or I will pass them in the run_command
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Env Vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    console.log("Fetching restaurant 'prueba'...");
    const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, phone, slug, delivery_zones, logo_url, theme_color')
        .eq('slug', 'prueba')
        .single();

    if (error) {
        console.error("Error fetching:", error);
    } else {
        console.log("Success:", data);
    }
}

testFetch();
