-- ============================================================
--  Safety Services — Migración 03
--  Permite mostrar las sucursales de un cliente como tarjetas separadas.
--  Pegá TODO esto en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- Si está en true, en "Mis clientes" cada sucursal aparece como su propia tarjeta.
-- Si está en false (por defecto), el cliente se ve como una sola tarjeta.
alter table public.empresas
  add column if not exists sucursales_separadas boolean not null default false;
