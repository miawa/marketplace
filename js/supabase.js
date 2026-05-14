
const SUPABASE_URL  = "https://rmawimcxlvvmhuznzsnt.supabase.co";
const SUPABASE_ANON = "sb_publishable_5O3USqKm0qPhJTdHn7aB6w_chB3OZOS";


window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);


window.supabase = window.supabaseClient;

console.log('Supabase client initialized and available as window.supabase');