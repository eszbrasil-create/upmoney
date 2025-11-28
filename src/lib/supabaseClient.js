import { createClient } from "@supabase/supabase-js";

// Cole aqui:
const SUPABASE_URL = "SUA_URL_AQUI";
const SUPABASE_ANON_KEY = "SUA_ANON_KEY_AQUI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
