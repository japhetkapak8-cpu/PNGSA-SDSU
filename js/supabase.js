import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL =
  "https://qvfswyshgwzflmklvrbl.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_yiIhqjJnNL6YVRqaqCA2yA_0ojlrxwA";

export const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );