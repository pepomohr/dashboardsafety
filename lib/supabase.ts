import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Cliente de Supabase. Mientras no estén cargadas las credenciales (.env.local),
// queda en null y la app funciona igual como maqueta (sin romper nada).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase: SupabaseClient | null =
  url && key && url.startsWith('http')
    ? createClient(url, key, {
        auth: {
          persistSession: true,      // la sesión queda guardada en el dispositivo
          autoRefreshToken: true,    // se renueva sola: no lo echa cada rato
          detectSessionInUrl: true,
        },
      })
    : null

export const supabaseReady = !!supabase

// ── Autenticación ──
export async function signIn(email: string, password: string) {
  if (!supabase) return { error: 'Supabase no está configurado.' }
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  return { error: error?.message ?? null }
}

export async function signOut() {
  await supabase?.auth.signOut()
}

/** Devuelve el perfil del usuario logueado ({ role, empresa_id }) o null si no hay sesión. */
export async function getProfile(): Promise<{ role: string; empresa_id: string | null } | null> {
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role, empresa_id').eq('id', user.id).single()
  return data ? { role: data.role, empresa_id: data.empresa_id } : { role: 'cliente', empresa_id: null }
}

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

// ── Catálogo de tipos de documento ──
export async function listTipos(): Promise<string[]> {
  if (!supabase) return []
  const { data } = await supabase.from('tipos_documento').select('nombre').order('orden')
  return (data || []).map((t: any) => t.nombre)
}

// ── Documentación ──
export interface DocRow {
  id: string
  tipo: string
  fecha_emision: string | null
  fecha_vencimiento: string | null
  archivo_path: string | null
  nota: string | null
}

export async function listDocumentos(empresaId: string, sucursalId?: string | null): Promise<DocRow[]> {
  if (!supabase) return []
  let q = supabase.from('documentos')
    .select('id, tipo, fecha_emision, fecha_vencimiento, archivo_url, nota')
    .eq('empresa_id', empresaId)
  q = sucursalId ? q.eq('sucursal_id', sucursalId) : q.is('sucursal_id', null)
  const { data, error } = await q.order('fecha_vencimiento', { ascending: true, nullsFirst: false })
  if (error) { console.error('listDocumentos:', error.message); return [] }
  return (data || []).map((d: any) => ({
    id: d.id, tipo: d.tipo, fecha_emision: d.fecha_emision,
    fecha_vencimiento: d.fecha_vencimiento, archivo_path: d.archivo_url, nota: d.nota,
  }))
}

/**
 * Sube el archivo de un documento al bucket privado "documentos".
 * La ruta arranca con el id de la empresa: así el cliente solo accede a lo suyo.
 * Devuelve la ruta interna (no una URL pública: el bucket es privado).
 */
export async function uploadDocumento(file: File, empresaId: string): Promise<string | null> {
  if (!supabase) return null
  const limpio = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80)
  const path = `${empresaId}/${Date.now()}-${limpio}`
  const { error } = await supabase.storage.from('documentos').upload(path, file, { upsert: false })
  if (error) { console.error('uploadDocumento:', error.message); return null }
  return path
}

/** Link temporal (1 hora) para ver/descargar un documento del bucket privado. */
export async function urlDocumento(path: string): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase.storage.from('documentos').createSignedUrl(path, 3600)
  if (error) { console.error('urlDocumento:', error.message); return null }
  return data.signedUrl
}

export async function crearDocumento(row: {
  empresa_id: string; sucursal_id?: string | null; tipo: string
  fecha_emision?: string | null; fecha_vencimiento?: string | null
  archivo_url?: string | null; nota?: string | null
}): Promise<DocRow | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('documentos').insert({
    empresa_id: row.empresa_id,
    sucursal_id: row.sucursal_id || null,
    tipo: row.tipo,
    fecha_emision: row.fecha_emision || null,
    fecha_vencimiento: row.fecha_vencimiento || null,
    archivo_url: row.archivo_url || null,
    nota: row.nota || null,
  }).select().single()
  if (error || !data) { console.error('crearDocumento:', error?.message); return null }
  return {
    id: data.id, tipo: data.tipo, fecha_emision: data.fecha_emision,
    fecha_vencimiento: data.fecha_vencimiento, archivo_path: data.archivo_url, nota: data.nota,
  }
}

/** Borra el documento y también su archivo del Storage (para no dejar basura). */
export async function borrarDocumento(id: string, archivoPath?: string | null): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.from('documentos').delete().eq('id', id)
  if (error) { console.error('borrarDocumento:', error.message); return false }
  if (archivoPath) await supabase.storage.from('documentos').remove([archivoPath])
  return true
}

// ── Sucursales ──
export async function crearSucursal(empresaId: string, nombre: string): Promise<{ id: string; name: string } | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('sucursales')
    .insert({ empresa_id: empresaId, name: nombre.trim() }).select().single()
  if (error || !data) { console.error('crearSucursal:', error?.message); return null }
  return { id: data.id, name: data.name }
}

/** Borra una sucursal. Su documentación y accidentes quedan sin sucursal asignada. */
export async function borrarSucursal(id: string): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.from('sucursales').delete().eq('id', id)
  if (error) { console.error('borrarSucursal:', error.message); return false }
  return true
}

/** Borra una empresa. Sucursales, documentos y accidentes caen en cascada. */
export async function borrarEmpresa(id: string): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.from('empresas').delete().eq('id', id)
  if (error) { console.error('borrarEmpresa:', error.message); return false }
  return true
}
