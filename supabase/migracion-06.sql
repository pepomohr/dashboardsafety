-- ============================================================
--  Safety Services — Migración 06
--  Que el cliente pueda ABRIR el archivo del documento desde su link.
--  Los archivos quedan accesibles por URL (la ruta lleva un id imposible de
--  adivinar), y la lista solo se obtiene con el token de la empresa.
--  Pegá TODO esto en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- El bucket de documentos pasa a ser accesible por URL directa.
update storage.buckets set public = true where id = 'documentos';

-- La función del cliente ahora también devuelve la ruta del archivo.
create or replace function public.datos_cliente(p_token uuid)
returns jsonb
language sql stable security definer set search_path = public as
$fn$
  select case when e.id is null then null else jsonb_build_object(
    'empresa', jsonb_build_object(
      'id', e.id, 'name', e.name, 'slug', e.slug, 'color', e.color,
      'rubro', e.rubro, 'sede', e.sede, 'logo_url', e.logo_url, 'trabajadores', e.trabajadores
    ),
    'documentos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', d.id, 'tipo', d.tipo, 'fecha_emision', d.fecha_emision,
        'fecha_vencimiento', d.fecha_vencimiento, 'nota', d.nota, 'archivo', d.archivo_url
      )) from public.documentos d where d.empresa_id = e.id
    ), '[]'::jsonb),
    'accidentes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id, 'fecha', a.fecha, 'hora', a.hora, 'turno', a.turno, 'area', a.area,
        'parte_cuerpo', a.parte_cuerpo, 'lesion', a.lesion, 'gravedad', a.gravedad,
        'investigacion', a.investigacion, 'descripcion', a.descripcion, 'cantidad', a.cantidad
      )) from public.accidentes a where a.empresa_id = e.id
    ), '[]'::jsonb)
  ) end
  from public.empresas e
  where e.token = p_token
$fn$;
grant execute on function public.datos_cliente(uuid) to anon, authenticated;
