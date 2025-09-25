import { createClient } from '@supabase/supabase-js'

class SupabaseManager {
  private static instance: SupabaseManager
  private client: any

  private constructor() {
    // Never hardcode keys. Use environment variables injected at build/runtime.
    const env = (globalThis as any)?.mdh?.env || (import.meta as any)?.env || process.env || {}
    const supabaseUrl = env.VITE_SUPABASE_URL
    // IMPORTANT: Use ANON key in renderer. Service role must never be used client-side.
    const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables. Please check your .env file (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).')
    }

    // Create client with anon key. Admin ops must go through a trusted backend/main process.
    this.client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      global: {
        headers: {
          'X-Client-Info': 'meri-design-house-desktop@1.0.0'
        }
      }
    })
  }

  public static getInstance(): SupabaseManager {
    if (!SupabaseManager.instance) {
      SupabaseManager.instance = new SupabaseManager()
    }
    return SupabaseManager.instance
  }

  public getClient(): any {
    if (!this.client) {
      throw new Error('Supabase client not initialized yet')
    }
    return this.client
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const client = this.getClient()
      const { error } = await client.from('raw_materials').select('count', { count: 'exact', head: true })
      return !error
    } catch {
      return false
    }
  }
}

export const supabaseManager = SupabaseManager.getInstance()
export const supabase = supabaseManager.getClient()
export default supabase