-- ============================================================
--  Safety Services — Migración 05
--  Acceso del cliente por LINK SECRETO (sin contraseña).
--  Cada empresa tiene un token aleatorio; el link lo lleva.
--  Con el token exacto se ven los datos; sin él, nada.
--  Pegá TODO esto en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- Token secreto por empresa (imposible de adivinar)
alter table public.empresas
  add column if not exists token uuid not null default gen_random_uuid();
create unique index if not exists idx_empresas_token on public.empresas(token);

-- Función que devuelve TODO lo que el cliente necesita, solo si presenta el token
-- correcto. Corre con permisos elevados (security definer) pero exige el token,
-- así que nadie puede pedir los datos de otra empresa.
create or replace function public.datos_cliente(p_token uuid)
returns jsonb
language sql stable security definer set search_path = public as
$$
  select case when e.id is null then null else jsonb_build_object(
    'empresa', jsonb_build_object(
      'id', e.id, 'name', e.name, 'slug', e.slug, 'color', e.color,
      'rubro', e.rubro, 'sede', e.sede, 'logo_url', e.logo_url, 'trabajadores', e.trabajadores
    ),
    'documentos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', d.id, 'tipo', d.tipo, 'fecha_emision', d.fecha_emision,
        'fecha_vencimiento', d.fecha_vencimiento, 'nota', d.nota
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
$$;

-- Cualquiera con el token (aunque no esté logueado) puede ejecutarla.
grant execute on function public.datos_cliente(uuid) to anon, authenticated;
