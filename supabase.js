const SUPABASE_URL =
    "https://uwxtpiwrmecdgabyicpa.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_YKUIrkT58Ecsp-Hl_5OBVg_BKpMEbDd";

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );