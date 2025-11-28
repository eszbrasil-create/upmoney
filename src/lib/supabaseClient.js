// src/lib/supabaseClient.js

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://pbcqsapoxcioqhqonstf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Z7NSZSRMW0sWsqdfGyXyiw_UZHGtcZt";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
