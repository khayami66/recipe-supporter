import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase環境変数が設定されていません。.env ファイルでVITE_SUPABASE_URLとVITE_SUPABASE_ANON_KEYを設定してください。');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);