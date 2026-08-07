-- ============================================================
--  Safety Services — Migración 04
--  Prepara la tabla de accidentes para datos reales.
--  Pegá TODO esto en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- Cantidad de lesiones por registro (el mapa corporal suma varias a la vez).
alter table public.accidentes
  add column if not exists cantidad int not null default 1;

-- Cantidad de trabajadores de la empresa/sucursal: sirve para el índice de
-- incidencia real ( = accidentes / trabajadores × 100 ). Si es 0/null, no se calcula.
alter table public.empresas
  add column if not exists trabajadores int;
alter table public.sucursales
  add column if not exists trabajadores int;
