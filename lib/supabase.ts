import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Cliente de Supabase. Mientras no estén cargadas las credenciales (.env.local),
// queda en null y la app funciona igual como maqueta (sin romper nada).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase: SupabaseClient | null =
  url && key && url.startsWith('http') ? createClient(url, key) : null

export const supabaseReady = !!supabase

/**
 * Sube un logo de empresa al bucket "logos" y devuelve su URL pública.
 * Si Supabase todavía no está conectado, devuelve null (se usa la vista previa local).
 * Requiere: un bucket público llamado "logos" en Supabase Storage.
 */
export async function uploadLogo(file: File, slug: string): Promise<string | null> {
  if (!supabase) return null
  const ext = (file.name.split('.').pop() || 'png').toLowerCase()
  const path = `${slug}-${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('logos').upload(path, file, {
    cacheControl: '3600', upsert: true,
  })
  if (error) { console.error('uploadLogo:', error.message); return null }
  const { data } = supabase.storage.from('logos').getPublicUrl(path)
  return data.publicUrl
}
