-- ============================================================
--  Safety Services — Esquema de base de datos (Supabase / PostgreSQL)
--  Pegá TODO esto en:  Supabase → SQL Editor → New query → Run
--  Es idempotente en lo posible; si algo ya existe, se puede re-correr.
-- ============================================================

-- ---------- 1. PERFILES DE USUARIO ----------
-- Cada usuario de la app tiene un perfil con su rol y (si es cliente) su empresa.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nombre      text,
  role        text not null default 'cliente' check (role in ('admin','cliente')),
  empresa_id  uuid,              -- si es cliente: a qué empresa pertenece
  created_at  timestamptz default now()
);

-- ---------- 2. EMPRESAS (clientes) ----------
create table if not exists public.empresas (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  color       text default '#6FB63F',
  rubro       text,
  sede        text,
  is_client   boolean default true,   -- true = cliente oficial, false = prospecto
  logo_url    text,                   -- URL pública del logo en Storage
  created_at  timestamptz default now()
);

-- ---------- 3. SUCURSALES ----------
create table if not exists public.sucursales (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  name        text not null,
  created_at  timestamptz default now()
);

-- ---------- 4. TIPOS DE DOCUMENTO (catálogo) ----------
create table if not exists public.tipos_documento (
  id            serial primary key,
  nombre        text not null,
  orden         int  default 0,
  solo_pdf      boolean default false,   -- documentos que solo se descargan (sin vencimiento útil)
  capacitacion  boolean default false    -- llevan indicador de % de personal capacitado
);

-- ---------- 5. DOCUMENTOS ----------
create table if not exists public.documentos (
  id                uuid primary key default gen_random_uuid(),
  empresa_id        uuid not null references public.empresas(id) on delete cascade,
  sucursal_id       uuid references public.sucursales(id) on delete set null,
  tipo              text not null,
  fecha_emision     date,
  fecha_vencimiento date,
  desvio            text default 'sin' check (desvio in ('sin','con','na')),
  nota              text,
  pct_capacitado    int,          -- para capacitaciones
  archivo_url       text,         -- PDF/imagen en Storage
  created_at        timestamptz default now()
);
create index if not exists idx_documentos_empresa on public.documentos(empresa_id);

-- ---------- 6. ACCIDENTES ----------
create table if not exists public.accidentes (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references public.empresas(id) on delete cascade,
  sucursal_id     uuid references public.sucursales(id) on delete set null,
  fecha           date,
  hora            text,
  turno           text,
  area            text,
  parte_cuerpo    text,
  lesion          text,
  detalle         text,
  gravedad        text,     -- Leve / Moderada / Grave
  investigacion   text default 'No realizada',
  descripcion     text,
  created_at      timestamptz default now()
);
create index if not exists idx_accidentes_empresa on public.accidentes(empresa_id);

-- ============================================================
--  SEGURIDAD (Row Level Security)
--  admin (el Colo) ve/edita todo. cliente ve SOLO su empresa (solo lectura).
-- ============================================================

-- Helpers: rol y empresa del usuario actual
create or replace function public.mi_rol() returns text
  language sql stable security definer set search_path = public as
$$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.mi_empresa() returns uuid
  language sql stable security definer set search_path = public as
$$ select empresa_id from public.profiles where id = auth.uid() $$;

-- Activar RLS
alter table public.profiles      enable row level security;
alter table public.empresas      enable row level security;
alter table public.sucursales    enable row level security;
alter table public.documentos    enable row level security;
alter table public.accidentes    enable row level security;
alter table public.tipos_documento enable row level security;

-- profiles: cada uno ve su propio perfil; el admin ve todos
drop policy if exists p_profiles_self on public.profiles;
create policy p_profiles_self on public.profiles for select
  using (id = auth.uid() or public.mi_rol() = 'admin');

-- tipos_documento: cualquiera autenticado puede leer el catálogo
drop policy if exists p_tipos_read on public.tipos_documento;
create policy p_tipos_read on public.tipos_documento for select using (auth.role() = 'authenticated');

-- empresas
drop policy if exists p_empresas_admin on public.empresas;
create policy p_empresas_admin on public.empresas for all
  using (public.mi_rol() = 'admin') with check (public.mi_rol() = 'admin');
drop policy if exists p_empresas_cliente on public.empresas;
create policy p_empresas_cliente on public.empresas for select
  using (id = public.mi_empresa());

-- sucursales
drop policy if exists p_sucursales_admin on public.sucursales;
create policy p_sucursales_admin on public.sucursales for all
  using (public.mi_rol() = 'admin') with check (public.mi_rol() = 'admin');
drop policy if exists p_sucursales_cliente on public.sucursales;
create policy p_sucursales_cliente on public.sucursales for select
  using (empresa_id = public.mi_empresa());

-- documentos
drop policy if exists p_docs_admin on public.documentos;
create policy p_docs_admin on public.documentos for all
  using (public.mi_rol() = 'admin') with check (public.mi_rol() = 'admin');
drop policy if exists p_docs_cliente on public.documentos;
create policy p_docs_cliente on public.documentos for select
  using (empresa_id = public.mi_empresa());

-- accidentes
drop policy if exists p_acc_admin on public.accidentes;
create policy p_acc_admin on public.accidentes for all
  using (public.mi_rol() = 'admin') with check (public.mi_rol() = 'admin');
drop policy if exists p_acc_cliente on public.accidentes;
create policy p_acc_cliente on public.accidentes for select
  using (empresa_id = public.mi_empresa());

-- ============================================================
--  Trigger: al registrarse un usuario, crear su perfil automáticamente
-- ============================================================
create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as
$$
begin
  insert into public.profiles (id, nombre) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
--  STORAGE (buckets)
--   logos      → público (se ven en las tarjetas)
--   documentos → privado (PDFs; acceso por RLS)
-- ============================================================
insert into storage.buckets (id, name, public) values ('logos', 'logos', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('documentos', 'documentos', false)
  on conflict (id) do nothing;

-- logos: lectura pública; escritura solo admin
drop policy if exists s_logos_read on storage.objects;
create policy s_logos_read on storage.objects for select using (bucket_id = 'logos');
drop policy if exists s_logos_write on storage.objects;
create policy s_logos_write on storage.objects for insert to authenticated
  with check (bucket_id = 'logos' and public.mi_rol() = 'admin');

-- ============================================================
--  SEED: catálogo de los 28 tipos de documento
-- ============================================================
insert into public.tipos_documento (nombre, orden, solo_pdf, capacitacion) values
  ('RGRL — Relevamiento General de Riesgos Laborales', 1, false, false),
  ('RAR — Relevamiento de Agentes de Riesgo', 2, false, false),
  ('Capacitación del personal — Riesgos generales', 3, false, true),
  ('Capacitación del personal — Riesgos específicos', 4, false, true),
  ('Plan anual de capacitación', 5, true, false),
  ('Análisis de riesgo por puesto de trabajo', 6, false, false),
  ('Norma de trabajo seguro', 7, false, false),
  ('Investigación de accidentes', 8, false, false),
  ('Medición de ruido', 9, false, false),
  ('Medición de iluminación', 10, false, false),
  ('Medición de carga térmica', 11, false, false),
  ('Medición de contaminantes', 12, false, false),
  ('Evaluación de riesgo ergonómico', 13, false, false),
  ('Medición de puesta a tierra', 14, false, false),
  ('Análisis de agua / Limpieza de tanque', 15, false, false),
  ('Medición de vibraciones', 16, false, false),
  ('Plan de evacuación', 17, false, false),
  ('Estudio de riesgo de incendio', 18, false, false),
  ('Estudio de medios de salida', 19, false, false),
  ('Verificación de instalación de incendios', 20, false, false),
  ('Verificación de detección de incendios', 21, false, false),
  ('Verificación de extintores', 22, false, false),
  ('Aparatos sometidos a presión', 23, false, false),
  ('Ascensores y montacargas', 24, false, false),
  ('Verificación edilicia', 25, false, false),
  ('Póliza de ART', 26, false, false),
  ('Seguro de vida obligatorio', 27, false, false),
  ('Habilitación del establecimiento', 28, true, false)
on conflict do nothing;

-- ============================================================
--  LISTO. Próximo paso manual: crear tu usuario admin (el Colo).
--  Después de registrarte/loguearte una vez, corré:
--     update public.profiles set role = 'admin' where nombre = 'TU-EMAIL';
-- ============================================================


-- ============================================================
--  EXTRAS (antes estaban en migracion-02 y migracion-03)
-- ============================================================

-- Storage logos: update/delete (uploadLogo usa upsert)
drop policy if exists s_logos_update on storage.objects;
create policy s_logos_update on storage.objects for update to authenticated
  using      (bucket_id = 'logos' and public.mi_rol() = 'admin')
  with check (bucket_id = 'logos' and public.mi_rol() = 'admin');
drop policy if exists s_logos_delete on storage.objects;
create policy s_logos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'logos' and public.mi_rol() = 'admin');

-- Storage documentos: admin todo; cliente solo su carpeta (<empresa_id>/...)
drop policy if exists s_documentos_admin on storage.objects;
create policy s_documentos_admin on storage.objects for all to authenticated
  using      (bucket_id = 'documentos' and public.mi_rol() = 'admin')
  with check (bucket_id = 'documentos' and public.mi_rol() = 'admin');
drop policy if exists s_documentos_cliente on storage.objects;
create policy s_documentos_cliente on storage.objects for select to authenticated
  using (bucket_id = 'documentos'
         and (storage.foldername(name))[1] = public.mi_empresa()::text);

-- Indices
create index if not exists idx_sucursales_empresa on public.sucursales(empresa_id);
create index if not exists idx_documentos_sucursal on public.documentos(sucursal_id);
create index if not exists idx_accidentes_sucursal on public.accidentes(sucursal_id);
create index if not exists idx_documentos_venc     on public.documentos(fecha_vencimiento);
create index if not exists idx_profiles_empresa    on public.profiles(empresa_id);

-- FK de profiles.empresa_id
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_empresa_fk') then
    alter table public.profiles
      add constraint profiles_empresa_fk
      foreign key (empresa_id) references public.empresas(id) on delete set null;
  end if;
end $$;

alter table public.documentos alter column tipo set not null;

-- Columna: mostrar sucursales como tarjetas separadas
alter table public.empresas
  add column if not exists sucursales_separadas boolean not null default false;

-- (migración 04) Accidentes con datos reales
alter table public.accidentes add column if not exists cantidad int not null default 1;
alter table public.empresas   add column if not exists trabajadores int;
alter table public.sucursales add column if not exists trabajadores int;

-- (migración 05) Acceso del cliente por link secreto
alter table public.empresas add column if not exists token uuid not null default gen_random_uuid();
create unique index if not exists idx_empresas_token on public.empresas(token);
create or replace function public.datos_cliente(p_token uuid)
returns jsonb language sql stable security definer set search_path = public as
$fn$
  select case when e.id is null then null else jsonb_build_object(
    'empresa', jsonb_build_object('id', e.id, 'name', e.name, 'slug', e.slug, 'color', e.color, 'rubro', e.rubro, 'sede', e.sede, 'logo_url', e.logo_url, 'trabajadores', e.trabajadores),
    'documentos', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'tipo', d.tipo, 'fecha_emision', d.fecha_emision, 'fecha_vencimiento', d.fecha_vencimiento, 'nota', d.nota)) from public.documentos d where d.empresa_id = e.id), '[]'::jsonb),
    'accidentes', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'fecha', a.fecha, 'hora', a.hora, 'turno', a.turno, 'area', a.area, 'parte_cuerpo', a.parte_cuerpo, 'lesion', a.lesion, 'gravedad', a.gravedad, 'investigacion', a.investigacion, 'descripcion', a.descripcion, 'cantidad', a.cantidad)) from public.accidentes a where a.empresa_id = e.id), '[]'::jsonb)
  ) end from public.empresas e where e.token = p_token
$fn$;
grant execute on function public.datos_cliente(uuid) to anon, authenticated;
