'use client'

import { useState, useRef, useEffect } from 'react'
import { COLORS } from '@/lib/theme'

/**
 * Calendario propio con los colores de Safety (en vez del nativo del navegador).
 * value/onChange usan formato ISO "yyyy-mm-dd". min/max opcionales (ISO).
 */
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
const hoyISO = () => { const t = new Date(); return iso(t.getFullYear(), t.getMonth(), t.getDate()) }
function fmt(v: string) { if (!v) return ''; const [y, m, d] = v.split('-'); return `${d}/${m}/${y}` }

export default function DatePicker({ value, onChange, min, max, placeholder = 'dd/mm/aaaa' }: {
  value: string
  onChange: (v: string) => void
  min?: string
  max?: string
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [ver, setVer] = useState(() => {
    const base = value || hoyISO()
    const [y, m] = base.split('-').map(Number)
    return { y, m: m - 1 }
  })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    if (value) { const [y, m] = value.split('-').map(Number); setVer({ y, m: m - 1 }) }
  }, [value])

  const primerDia = (new Date(ver.y, ver.m, 1).getDay() + 6) % 7 // lunes = 0
  const diasMes = new Date(ver.y, ver.m + 1, 0).getDate()
  const celdas: (number | null)[] = [...Array(primerDia).fill(null), ...Array.from({ length: diasMes }, (_, i) => i + 1)]
  while (celdas.length % 7 !== 0) celdas.push(null)

  const fueraDeRango = (d: number) => {
    const v = iso(ver.y, ver.m, d)
    if (min && v < min) return true
    if (max && v > max) return true
    return false
  }
  const mover = (delta: number) => setVer(s => { const m = s.m + delta; return { y: s.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 } })
  const elegir = (d: number) => { onChange(iso(ver.y, ver.m, d)); setOpen(false) }

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="ss-input flex items-center justify-between w-full"
        style={{ color: value ? COLORS.grayDark : COLORS.grayMid }}>
        <span>{value ? fmt(value) : placeholder}</span>
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke={COLORS.green} strokeWidth={1.8}>
          <rect x="3" y="4.5" width="18" height="16" rx="2" /><path strokeLinecap="round" d="M3 9h18M8 3v3M16 3v3" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 ss-animate" style={{ width: 280 }}>
          {/* Encabezado mes/año */}
          <div className="flex items-center justify-between mb-2 px-1">
            <button type="button" onClick={() => mover(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={COLORS.grayDark} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <p className="text-sm font-bold" style={{ color: COLORS.grayDark }}>{MESES[ver.m]} {ver.y}</p>
            <button type="button" onClick={() => mover(1)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={COLORS.grayDark} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 mb-1">
            {DIAS.map(d => <div key={d} className="text-center text-[11px] font-bold py-1" style={{ color: COLORS.gray }}>{d}</div>)}
          </div>

          {/* Grilla */}
          <div className="grid grid-cols-7 gap-0.5">
            {celdas.map((d, i) => {
              if (d === null) return <div key={i} />
              const v = iso(ver.y, ver.m, d)
              const sel = v === value
              const esHoy = v === hoyISO()
              const off = fueraDeRango(d)
              return (
                <button key={i} type="button" disabled={off} onClick={() => elegir(d)}
                  className="h-9 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={sel
                    ? { backgroundColor: COLORS.green, color: '#fff', fontWeight: 700 }
                    : { color: COLORS.grayDark, border: esHoy ? `1.5px solid ${COLORS.green}` : '1.5px solid transparent' }}
                  onMouseEnter={e => { if (!sel && !off) e.currentTarget.style.backgroundColor = COLORS.greenLight }}
                  onMouseLeave={e => { if (!sel) e.currentTarget.style.backgroundColor = 'transparent' }}>
                  {d}
                </button>
              )
            })}
          </div>

          {/* Pie */}
          <div className="flex items-center justify-between mt-2 px-1">
            <button type="button" onClick={() => { onChange(''); setOpen(false) }} className="text-xs font-semibold" style={{ color: COLORS.gray }}>Borrar</button>
            <button type="button" onClick={() => { const h = hoyISO(); if (!(min && h < min) && !(max && h > max)) { onChange(h); setOpen(false) } }} className="text-xs font-semibold" style={{ color: COLORS.greenDark }}>Hoy</button>
          </div>
        </div>
      )}
    </div>
  )
}
