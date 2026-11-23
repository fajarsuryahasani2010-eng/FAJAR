import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppConfig } from '../types';

let cachedClient: SupabaseClient | null = null;
let cachedConfig: AppConfig | null = null;
let configPromise: Promise<AppConfig> | null = null;

export async function fetchAppConfig(): Promise<AppConfig> {
  if (cachedConfig) return cachedConfig;
  if (configPromise) return configPromise;

  configPromise = (async () => {
    const viteUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const viteKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = (await res.json()) as AppConfig;
        const url = data.supabaseUrl || viteUrl;
        const key = data.supabaseAnonKey || viteKey;
        cachedConfig = {
          configured: Boolean(url && key),
          hasServiceRole: data.hasServiceRole,
          supabaseUrl: url,
          supabaseAnonKey: key,
        };
        return cachedConfig;
      }
    } catch {
      // Fallback to Vite env vars
    }

    cachedConfig = {
      configured: Boolean(viteUrl && viteKey),
      hasServiceRole: false,
      supabaseUrl: viteUrl,
      supabaseAnonKey: viteKey,
    };
    return cachedConfig;
  })();

  return configPromise;
}

export async function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (cachedClient) return cachedClient;

  const cfg = await fetchAppConfig();
  if (!cfg.configured) {
    return null;
  }

  cachedClient = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return cachedClient;
}
