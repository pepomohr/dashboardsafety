'use client'

import { COLORS, statusStyle } from '@/lib/theme'
import { Empresa, empresaDocs } from '@/lib/empresas'
import EmpresaLogo from './EmpresaLogo'

function shade(hex: string, p: number) {
  if (!hex.startsWith('#')) return hex
  const n = parseInt(hex.slice(1), 16)
  const r = Math.max(0, Math.min(255, (n >> 16) + p))
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + p))
  const b = Math.max(0, Math.min(255, (n & 0xff) + p))
  return `rgb(${r},${g},${b})`
}

/** Conteo real de documentación de la empresa. Si no llega, se usan los datos de ejemplo. */
export interface DocStats { total: number; vig: number; exp: number; ven: number }

export default function EmpresaCard({ empresa, onEnter, stats }: { empresa: Empresa; onEnter: (e: Empresa) => void; stats?: DocStats }) {
  const mock = empresaDocs(empresa.severidad)
  const total = stats ? stats.total : mock.length
  const vig = stats ? stats.vig : mock.filter(d => d.status === 'valid').length
  const exp = stats ? stats.exp : mock.filter(d => d.status === 'expiring').length
  const ven = stats ? stats.ven : mock.filter(d => d.status === 'expired').length
  const estado = ven > 0 ? 'expired' : exp > 0 ? 'expiring' : 'valid'
  const s = statusStyle(estado)

  return (
    <button onClick={() => onEnter(empresa)}
      className="group text-left bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      {/* Banda de color */}
      <div className="relative px-5 pt-5 pb-6"
        style={{ background: `linear-gradient(135deg, ${empresa.color}, ${shade(empresa.color, -28)})` }}>
        {/* chip de estado */}
        <span className="absolute top-4 right-4 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur"
          style={{ backgroundColor: 'rgba(255,255,255,.9)', color: s.text }}>
          {total === 0 ? 'Sin documentación' : ven > 0 ? `${ven} vencido${ven > 1 ? 's' : ''}` : exp > 0 ? `${exp} por vencer` : 'Al día'}
        </span>
        <p className="text-[10px] italic font-semibold tracking-wide" style={{ color: 'rgba(255,255,255,.85)' }}>
          {empresa.isClient ? 'CLIENTE OFICIAL DE SAFETY SERVICES' : 'PROSPECTO'}
        </p>
        <p className="font-display text-white text-xl font-extrabold leading-tight mt-1 pr-16">{empresa.name}</p>
      </div>

      {/* Cuerpo */}
      <div className="p-5 flex-1 flex flex-col">
        <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: COLORS.gray }}>Rubro</p>
        <p className="text-sm font-medium" style={{ color: COLORS.grayDark }}>{empresa.rubro}</p>

        <div className="flex items-center gap-1.5 mt-2">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke={empresa.color} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs" style={{ color: COLORS.gray }}>{empresa.sede}</span>
        </div>

        {/* Logo + estado documental */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <EmpresaLogo name={empresa.name} color={empresa.color} slug={empresa.slug} logoUrl={empresa.logoUrl} size={52} />
          <div className="text-right">
            <p className="text-lg font-bold" style={{ color: s.hex }}>{vig}/{total}</p>
            <p className="text-[10px]" style={{ color: COLORS.gray }}>docs vigentes</p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-4 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-colors"
          style={{ backgroundColor: COLORS.bg, color: COLORS.greenDark }}>
          Ingresar
          <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  )
}
