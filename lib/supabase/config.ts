// Public Supabase settings. The publishable key is designed to be shipped to
// browsers; all data access is controlled by Row Level Security in the database.
// Environment variables (if set in Coolify) take precedence.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jwjvajvqzckrzuqexpsq.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_fDM1FhyJgTV_45_a_VctTw_wGBuO_m-";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lavidaensueno.com";
