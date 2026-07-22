-- ============================================================
--  Safety Services — Migración 02
--  Corrige permisos de Storage y agrega índices que faltaban.
--  Pegá TODO esto en: Supabase → SQL Editor → New query → Run
--  Se puede correr las veces que haga falta (es idempotente).
-- ============================================================

-- ---------- 1. LOGOS: faltaban update y delete ----------
-- uploadLogo() sube con upsert=true, que necesita permiso de UPDATE.
-- Sin esto, cambiar el logo de un cliente fallaba en silencio.
drop policy if exists s_logos_update on storage.objects;
create policy s_logos_update on storage.objects for update to authenticated
  using      (bucket_id = 'logos' and public.mi_rol() = 'admin')
  with check (bucket_id = 'logos' and public.mi_rol() = 'admin');

drop policy if exists s_logos_delete on storage.objects;
create policy s_logos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'logos' and public.mi_rol() = 'admin');

-- ---------- 2. DOCUMENTOS: el bucket no tenía NINGUNA política ----------
-- Sin esto no se podía subir ni un solo PDF (el bucket es privado).
-- Convención de ruta: <empresa_id>/<archivo>  → así el cliente solo ve lo suyo.
drop policy if exists s_documentos_admin on storage.objects;
create policy s_documentos_admin on storage.objects for all to authenticated
  using      (bucket_id = 'documentos' and public.mi_rol() = 'admin')
  with check (bucket_id = 'documentos' and public.mi_rol() = 'admin');

drop policy if exists s_documentos_cliente on storage.objects;
create policy s_documentos_cliente on storage.objects for select to authenticated
  using (bucket_id = 'documentos'
         and (storage.foldername(name))[1] = public.mi_empresa()::text);

-- ---------- 3. Índices que faltaban ----------
create index if not exists idx_sucursales_empresa on public.sucursales(empresa_id);
create index if not exists idx_documentos_sucursal on public.documentos(sucursal_id);
create index if not exists idx_accidentes_sucursal on public.accidentes(sucursal_id);
create index if not exists idx_documentos_venc     on public.documentos(fecha_vencimiento);
create index if not exists idx_profiles_empresa    on public.profiles(empresa_id);

-- ---------- 4. Integridad ----------
-- profiles.empresa_id no tenía foreign key: si se borraba una empresa,
-- quedaban perfiles apuntando a una empresa inexistente.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_empresa_fk') then
    alter table public.profiles
      add constraint profiles_empresa_fk
      foreign key (empresa_id) references public.empresas(id) on delete set null;
  end if;
end $$;

-- El nombre del documento debe existir siempre.
alter table public.documentos alter column tipo set not null;

-- ---------- 5. Limpieza de datos de prueba ----------
-- Borra las empresas de demo (Comafi y Belgrano) y, en cascada,
-- sus sucursales, documentos y accidentes. La app arranca 0 km.
delete from public.empresas where slug in ('comafi', 'belgrano');
