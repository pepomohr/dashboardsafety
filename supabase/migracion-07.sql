-- ============================================================
--  Safety Services — Migración 07
--  Links por SUCURSAL: la función ahora dice a qué sucursal pertenece cada
--  documento/accidente, y devuelve la lista de sucursales. Así el link de
--  "Lomas de Zamora" muestra solo lo de Lomas, y el de "Ramos" solo lo de Ramos.
--  Pegá TODO esto en: Supabase → SQL Editor → New query → Run
-- ============================================================

create or replace function public.datos_cliente(p_token uuid)
returns jsonb
language sql stable security definer set search_path = public as
$fn$
  select case when e.id is null then null else jsonb_build_object(
    'empresa', jsonb_build_object(
      'id', e.id, 'name', e.name, 'slug', e.slug, 'color', e.color,
      'rubro', e.rubro, 'sede', e.sede, 'logo_url', e.logo_url, 'trabajadores', e.trabajadores
    ),
    'sucursales', coalesce((
      select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name) order by s.name)
      from public.sucursales s where s.empresa_id = e.id
    ), '[]'::jsonb),
    'documentos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', d.id, 'tipo', d.tipo, 'fecha_emision', d.fecha_emision,
        'fecha_vencimiento', d.fecha_vencimiento, 'nota', d.nota, 'archivo', d.archivo_url,
        'sucursal_id', d.sucursal_id
      )) from public.documentos d where d.empresa_id = e.id
    ), '[]'::jsonb),
    'accidentes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id, 'fecha', a.fecha, 'hora', a.hora, 'turno', a.turno, 'area', a.area,
        'parte_cuerpo', a.parte_cuerpo, 'lesion', a.lesion, 'gravedad', a.gravedad,
        'investigacion', a.investigacion, 'descripcion', a.descripcion, 'cantidad', a.cantidad,
        'sucursal_id', a.sucursal_id
      )) from public.accidentes a where a.empresa_id = e.id
    ), '[]'::jsonb)
  ) end
  from public.empresas e
  where e.token = p_token
$fn$;
grant execute on function public.datos_cliente(uuid) to anon, authenticated;
