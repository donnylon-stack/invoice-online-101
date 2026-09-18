import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
const supabaseKey = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_API_KEY)) || '';

export const isCloudConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = isCloudConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-anon-key', {
      auth: { persistSession: false, autoRefreshToken: false }
    });

/**
 * Health check helper for Cloud Database connection
 */
export async function checkSupabaseConnection() {
  if (!isCloudConfigured) {
    return { ok: false, message: 'Kredensial cloud belum disetel di file environment (.env)' };
  }
  try {
    const { data, error } = await supabase.from('invoices').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
      console.warn('Cloud Database check status:', error.message);
      return { ok: false, message: error.message };
    }
    return { ok: true, message: 'Terhubung ke Cloud Database' };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}
