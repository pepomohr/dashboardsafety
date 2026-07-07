'use client'

import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, AreaChart, Area, CartesianGrid, Legend, LabelList,
  LineChart, Line, ReferenceLine,
} from 'recharts'
import { COLORS, statusStyle } from '@/lib/theme'
import {
  documents, accidentesPorMes, accidentesPorArea, accidentesPorTurno,
  investigacion, diagnosticos, indices, partesCuerpo, PART_LABELS,
  gravedadLesiones, circunstancia, causas, origen, accidentesPorPuesto,
  diasPerdidos, indiceComparado,
} from '@/lib/mockData'
import {
  empresas, empresaDocs, empresaPartes,
  empresaAccidentesPorMes, empresaAccidentesPorArea, empresaIndices,
} from '@/lib/empresas'
import Gauge from '@/components/Gauge'
import BodyMap2 from '@/components/BodyMap2'
import Sidebar, { NavItem } from '@/components/Sidebar'
import Logo from '@/components/Logo'
import InformeReporte from '@/components/InformeReporte'
import DemoSwitcher from '@/components/DemoSwitcher'

const ANIOS = ['2024', '2025', '2026']
const MESES_FULL = ['Todos los meses','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function parteHeat(count: number) {
  if (count <= 0) return COLORS.grayLight
  if (count <= 2) return '#C7E3AC'
  if (count <= 4) return COLORS.warn
  return COLORS.danger
}

const CAT_COLORS = [COLORS.green, COLORS.warn, COLORS.danger, COLORS.grayMid, COLORS.greenDark, '#7E57C2', '#1E9BD7']

function Donut({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={40} outerRadius={64} paddingAngle={3}>
            {data.map((e, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v: any) => `${v}`} contentStyle={{ borderRadius: 12, border: '1px solid #eee', fontSize: 13 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1 mt-1">
        {data.map((e, i) => (
          <div key={e.label} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 min-w-0" style={{ color: COLORS.grayDark }}>
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }} />
              <span className="truncate">{e.label}</span>
            </span>
            <span className="font-bold flex-shrink-0 ml-2" style={{ color: COLORS.grayDark }}>{e.value}{total ? ` · ${Math.round((e.value / total) * 100)}%` : ''}</span>
          </div>
        ))}
      </div>
    </>
  )
}

function Card({ title, children, className = '', action }: { title?: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-sm font-bold uppercase tracking-wide" style={{ color: COLORS.grayDark }}>{title}</h3>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
    </svg>
  ) },
  { id: 'documentacion', label: 'Documentación', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ) },
]

export default function PreviewClienteDashboard() {
  const [view, setView] = useState('dashboard')
  const [anio, setAnio] = useState('2026')
  const [mes, setMes] = useState(0)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [bellOpen, setBellOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [informeOpen, setInformeOpen] = useState(false)

  // Cliente del link (?empresa=comafi&sucursal=lomas). Sin parámetro → demo.
  const [empSlug, setEmpSlug] = useState<string | null>(null)
  const [sucId, setSucId] = useState<string | null>(null)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    let e = p.get('empresa'), s = p.get('sucursal')
    // El link fija el cliente y lo recordamos (para cuando abran la app instalada sin el parámetro)
    if (e) { try { localStorage.setItem('ss_empresa', e); localStorage.setItem('ss_sucursal', s || '') } catch {} }
    else { try { e = localStorage.getItem('ss_empresa'); s = localStorage.getItem('ss_sucursal') } catch {} }
    setEmpSlug(e)
    setSucId(s || null)
  }, [])
  const emp = empresas.find(e => e.slug === empSlug) ?? null
  const branch = emp?.sucursales?.find(s => s.id === sucId) ?? emp?.sucursales?.[0] ?? null
  const factor = branch?.factor ?? emp?.factor ?? 1
  const severidad = branch?.severidad ?? emp?.severidad ?? 0
  const empresaName = emp ? (branch ? `${emp.name} · ${branch.name}` : emp.name) : 'Empresa Demo S.A.'

  // Fuentes de datos: las del cliente del link, o el demo por defecto
  const docsSource = emp ? empresaDocs(severidad) : documents
  const partesSource = emp ? empresaPartes(factor) : partesCuerpo
  const mesSource = emp ? empresaAccidentesPorMes(factor) : accidentesPorMes
  const areaSource = emp ? empresaAccidentesPorArea(factor) : accidentesPorArea
  const indicesSource = emp ? empresaIndices(factor) : indices

  // Conteo documental
  const vig = docsSource.filter(d => d.status === 'valid').length
  const exp = docsSource.filter(d => d.status === 'expiring').length
  const ven = docsSource.filter(d => d.status === 'expired').length
  const total = docsSource.length

  // El velocímetro muestra SIEMPRE el documento más urgente
  const today = new Date()
  const daysTo = (iso: string) => Math.round((new Date(iso + 'T00:00:00').getTime() - today.getTime()) / 86400000)
  const docsConDias = docsSource.map(d => ({ ...d, days: daysTo(d.expiry) }))
  const urgente = docsConDias.slice().sort((a, b) => a.days - b.days)[0]
  // Avisos reales para la campanita: vencidos + próximos a vencer (≤30 días)
  const alertas = docsConDias.filter(d => d.days <= 30).sort((a, b) => a.days - b.days)

  function urgencyValue(days: number) {
    if (days <= 0)   return 1
    if (days <= 30)  return 0.75 + ((30 - days) / 30) * 0.25
    if (days <= 90)  return 0.5 + ((90 - days) / 60) * 0.25
    if (days <= 365) return ((365 - days) / 275) * 0.5
    return 0
  }
  const gaugeValue = urgencyValue(urgente.days)

  const INVEST_COLORS = [COLORS.green, COLORS.warn, COLORS.danger]

  // ── Filtros funcionales (año / mes / rango) ──
  const yearFactor = ({ '2024': 1.3, '2025': 1.15, '2026': 1 } as Record<string, number>)[anio] ?? 1
  const scale = (n: number) => Math.round(n * yearFactor)
  const mDesde = desde ? Number(desde.slice(5, 7)) : null
  const mHasta = hasta ? Number(hasta.slice(5, 7)) : null
  const mesesData = mesSource
    .map(m => ({ mes: m.mes, accidentes: scale(m.accidentes), incidentes: scale(m.incidentes) }))
    .filter((_, i) => {
      const mn = i + 1
      if (mes > 0 && mn !== mes) return false
      if (mDesde && mn < mDesde) return false
      if (mHasta && mn > mHasta) return false
      return true
    })
  const totalAccidentesF = mesesData.reduce((s, m) => s + m.accidentes, 0)
  const mesMax = mesesData.length ? mesesData.reduce((a, b) => (b.accidentes > a.accidentes ? b : a)) : { mes: '—', accidentes: 0 }
  const areaData = areaSource.map(a => ({ area: a.area, valor: scale(a.valor) }))
  const partesData = Object.fromEntries(Object.entries(partesSource).map(([k, v]) => [k, scale(v)])) as Record<string, number>
  const idxF = {
    frecuencia: +(indicesSource.frecuencia * yearFactor).toFixed(2),
    gravedad: +(indicesSource.gravedad * yearFactor).toFixed(2),
    incidencia: +(indicesSource.incidencia * yearFactor).toFixed(2),
  }
  const periodoLabel = mes > 0 ? MESES_FULL[mes] : (mDesde || mHasta) ? 'Período filtrado' : `Año ${anio}`

  // Marca con aviso de vencidos en el ítem Documentación
  const navItems: NavItem[] = NAV.map(it =>
    it.id === 'documentacion' && ven > 0 ? { ...it, hint: String(ven) } : it)

  // Distribución documental para la torta
  const docStatusData = [
    { name: 'Vigentes',   value: vig, color: COLORS.green },
    { name: 'Por vencer', value: exp, color: COLORS.warn },
    { name: 'Vencidos',   value: ven, color: COLORS.danger },
  ]

  // ── Tarjeta de estado documental (gauge + urgente + conteos) ──
  const documentalCard = (
    <Card title="Estado de la documentación"
      action={<span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: COLORS.greenLight, color: COLORS.greenDark }}>{vig}/{total} vigentes</span>}>
      <div className="flex flex-col items-center">
        {/* Barra de proporción — estado general de vigencia */}
        <div className="w-full mb-3">
          <div className="flex h-6 w-full rounded-full overflow-hidden" style={{ backgroundColor: COLORS.grayLight }}>
            {vig > 0 && <div style={{ width: `${(vig / total) * 100}%`, backgroundColor: COLORS.green }} />}
            {exp > 0 && <div style={{ width: `${(exp / total) * 100}%`, backgroundColor: COLORS.warn }} />}
            {ven > 0 && <div style={{ width: `${(ven / total) * 100}%`, backgroundColor: COLORS.danger }} />}
          </div>
          <p className="text-center text-sm font-bold mt-2" style={{ color: COLORS.grayDark }}>{vig} de {total} documentos vigentes</p>
        </div>
        {(() => {
          const us = statusStyle(urgente.status)
          const venc = urgente.days < 0
          return (
            <div className="w-full rounded-xl px-4 py-3 text-center" style={{ backgroundColor: us.bg }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: us.text }}>
                {venc ? '⚠ Requiere atención' : 'Próximo a vencer'}
              </p>
              <p className="text-sm font-bold mt-0.5 leading-tight" style={{ color: us.text }}>{urgente.name}</p>
              <p className="text-xs mt-0.5" style={{ color: us.text }}>
                {venc ? `Venció hace ${Math.abs(urgente.days)} días`
                  : urgente.days === 0 ? 'Vence hoy' : `Vence en ${urgente.days} días`}
              </p>
            </div>
          )
        })()}
        <div className="grid grid-cols-3 gap-3 w-full mt-3">
          <div className="text-center rounded-xl py-3" style={{ backgroundColor: COLORS.greenLight }}>
            <p className="text-2xl font-bold" style={{ color: COLORS.greenDark }}>{vig}</p>
            <p className="text-xs font-semibold" style={{ color: COLORS.greenDark }}>Vigentes</p>
          </div>
          <div className="text-center rounded-xl py-3" style={{ backgroundColor: '#FBF3DD' }}>
            <p className="text-2xl font-bold" style={{ color: '#8A6A12' }}>{exp}</p>
            <p className="text-xs font-semibold" style={{ color: '#8A6A12' }}>Por vencer</p>
          </div>
          <div className="text-center rounded-xl py-3" style={{ backgroundColor: '#FBE9E5' }}>
            <p className="text-2xl font-bold" style={{ color: '#9A2A18' }}>{ven}</p>
            <p className="text-xs font-semibold" style={{ color: '#9A2A18' }}>Vencidos</p>
          </div>
        </div>
      </div>
    </Card>
  )

  // ── Lista detallada de los 28 documentos ──
  const docListCard = (
    <Card title="Documentación — detalle">
      <div className="space-y-1">
        {docsSource.map(doc => {
          const s = statusStyle(doc.status)
          const d2 = daysTo(doc.expiry)
          // Barra de vigencia: cuánta "vida" le queda al documento (365 días = lleno)
          const barPct = doc.status === 'expired' ? 100 : Math.max(5, Math.min(100, Math.round((d2 / 365) * 100)))
          return (
            <div key={doc.id} className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.hex }} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate" style={{ color: COLORS.grayDark }}>{doc.name}</p>
                <p className="text-xs" style={{ color: COLORS.gray }}>
                  {doc.status === 'expired' ? `Venció hace ${Math.abs(d2)} días` : d2 === 0 ? 'Vence hoy' : `Vence en ${d2} días`}
                  {' · '}{doc.expiry.split('-').reverse().join('/')}
                  {doc.note && ` · ${doc.note}`}
                </p>
                {/* Barra de vigencia del documento */}
                <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.grayLight }}>
                  <div className="h-full rounded-full" style={{ width: `${barPct}%`, backgroundColor: s.hex }} />
                </div>
              </div>
              {doc.pct !== undefined && (
                <div className="hidden sm:flex items-center gap-2 w-28">
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.grayLight }}>
                    <div className="h-full rounded-full" style={{ width: `${doc.pct}%`, backgroundColor: COLORS.green }} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: COLORS.grayDark }}>{doc.pct}%</span>
                </div>
              )}
              <span className="hidden md:inline text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: doc.desvio === 'con' ? '#FBE9E5' : doc.desvio === 'na' ? COLORS.grayLight : COLORS.greenLight,
                  color: doc.desvio === 'con' ? '#9A2A18' : doc.desvio === 'na' ? COLORS.gray : COLORS.greenDark,
                }}>
                {doc.desvio === 'con' ? 'Con desvíos' : doc.desvio === 'na' ? 'No aplica' : 'Sin desvíos'}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0" style={{ backgroundColor: s.bg, color: s.text }}>{s.label}</span>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0" title="Descargar PDF">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={COLORS.gray} strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>
    </Card>
  )

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: COLORS.bg }}>
      <Sidebar items={navItems} active={view} onChange={setView} role="Cliente" empresa={empresaName}
        open={navOpen} onClose={() => setNavOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* ════════ TOP BAR ════════ */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-4 md:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Hamburguesa + logo (solo mobile) */}
              <button onClick={() => setNavOpen(true)}
                className="md:hidden w-10 h-10 -ml-1 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors" aria-label="Menú">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={COLORS.grayDark} strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="md:hidden"><Logo size={34} /></div>
              <div>
                <h1 className="font-display font-extrabold text-lg leading-none" style={{ color: COLORS.grayDark }}>
                  {view === 'dashboard' ? 'Dashboard' : 'Documentación'}
                </h1>
                <p className="text-xs mt-1" style={{ color: COLORS.gray }}>{empresaName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Campanita */}
              <div className="relative">
                <button onClick={() => setBellOpen(o => !o)}
                  className="relative w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5 ss-bell" fill="none" viewBox="0 0 24 24" stroke={COLORS.grayDark} strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {alertas.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ backgroundColor: COLORS.danger }}>{alertas.length}</span>
                  )}
                </button>
                {bellOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 max-h-96 overflow-y-auto">
                    <div className="px-4 py-3 border-b border-gray-100 sticky top-0 bg-white">
                      <p className="text-sm font-bold" style={{ color: COLORS.grayDark }}>Notificaciones</p>
                    </div>
                    {alertas.length === 0 ? (
                      <div className="px-4 py-6 text-center">
                        <p className="text-sm" style={{ color: COLORS.gray }}>Todo en orden ✓</p>
                      </div>
                    ) : alertas.map(n => {
                      const venc = n.days < 0
                      return (
                        <div key={n.id} className="px-4 py-3 border-b border-gray-50 flex gap-2.5">
                          <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: venc ? COLORS.danger : COLORS.warn }} />
                          <div>
                            <p className="text-sm" style={{ color: COLORS.grayDark }}>
                              {n.name} {venc ? 'venció' : 'está por vencer'}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: COLORS.gray }}>
                              {venc ? `Hace ${Math.abs(n.days)} días` : n.days === 0 ? 'Vence hoy' : `Vence en ${n.days} días`}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              <button onClick={() => setInformeOpen(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90" style={{ backgroundColor: COLORS.green }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Descargar informe PDF
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl w-full mx-auto px-4 md:px-6 py-6 space-y-5">

          {/* ══════════════ VISTA DASHBOARD ══════════════ */}
          {view === 'dashboard' && (
            <div key="dash" className="ss-animate space-y-5">
              {/* Filtros */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: COLORS.gray }}>Año</label>
                  <select value={anio} onChange={e => setAnio(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2"
                    style={{ minWidth: 110, color: COLORS.grayDark }}>
                    {ANIOS.map(a => <option key={a} style={{ color: COLORS.grayDark }}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: COLORS.gray }}>Mes</label>
                  <select value={mes} onChange={e => setMes(Number(e.target.value))}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2" style={{ minWidth: 150, color: COLORS.grayDark }}>
                    {MESES_FULL.map((m, i) => <option key={m} value={i} style={{ color: COLORS.grayDark }}>{m}</option>)}
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: COLORS.gray }}>Desde</label>
                    <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2" style={{ color: COLORS.grayDark }} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: COLORS.gray }}>Hasta</label>
                    <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2" style={{ color: COLORS.grayDark }} />
                  </div>
                </div>
                <button className="px-4 py-2 rounded-lg text-sm font-semibold border transition-colors hover:bg-gray-50"
                  style={{ borderColor: COLORS.green, color: COLORS.greenDark }}
                  onClick={() => { setMes(0); setDesde(''); setHasta('') }}>
                  Limpiar
                </button>
              </div>

              {/* Índices */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Accidentes acumulados', value: totalAccidentesF, sub: periodoLabel, color: COLORS.grayDark },
                  { label: 'Índice de incidencia',  value: idxF.incidencia.toFixed(2), sub: 'accidentes con baja', color: COLORS.warn },
                ].map(k => (
                  <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 border-l-4" style={{ borderLeftColor: k.color }}>
                    <p className="text-3xl font-bold" style={{ color: k.color }}>{k.value}</p>
                    <p className="text-sm font-semibold mt-1" style={{ color: COLORS.grayDark }}>{k.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: COLORS.gray }}>{k.sub}</p>
                  </div>
                ))}
              </div>

              {/* Accidentes por mes (solo accidentes) */}
              <Card title="Accidentes por mes"
                action={<span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: COLORS.greenLight, color: COLORS.greenDark }}>Pico: {mesMax.mes} ({mesMax.accidentes})</span>}>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={mesesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gAcc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS.green} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={COLORS.green} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 12, fill: COLORS.gray }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: COLORS.gray }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #eee', fontSize: 13 }} />
                    <Area type="monotone" dataKey="accidentes" name="Accidentes" stroke={COLORS.green} fill="url(#gAcc)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              {/* Fila: área + turno + tipo de lesión */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <Card title="Accidentes por área">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                      <XAxis dataKey="area" tick={{ fontSize: 11, fill: COLORS.gray }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: COLORS.gray }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip cursor={{ fill: '#f6f6f6' }} contentStyle={{ borderRadius: 12, border: '1px solid #eee', fontSize: 13 }} />
                      <Bar dataKey="valor" name="Accidentes" radius={[6, 6, 0, 0]}>
                        {areaData.map((e, i) => (
                          <Cell key={i} fill={e.valor >= 10 ? COLORS.danger : e.valor >= 6 ? COLORS.warn : COLORS.green} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <Card title="Accidentes por turno">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={accidentesPorTurno} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="turno" tick={{ fontSize: 13, fill: COLORS.grayDark }} axisLine={false} tickLine={false} width={70} />
                      <Tooltip formatter={(v) => `${v}%`} cursor={{ fill: '#f6f6f6' }} contentStyle={{ borderRadius: 12, border: '1px solid #eee', fontSize: 13 }} />
                      <Bar dataKey="valor" name="% de accidentes" radius={[0, 6, 6, 0]} barSize={28}>
                        {accidentesPorTurno.map((e, i) => (
                          <Cell key={i} fill={e.turno === 'Tarde' ? COLORS.green : COLORS.grayMid} />
                        ))}
                        <LabelList dataKey="valor" position="right" formatter={(v: any) => `${v}%`}
                          style={{ fill: COLORS.grayDark, fontSize: 13, fontWeight: 700 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <Card title="Tipo de lesión">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={diagnosticos} margin={{ top: 10, right: 10, left: -20, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                      <XAxis dataKey="tipo" tick={{ fontSize: 10, fill: COLORS.gray }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" interval={0} />
                      <YAxis tick={{ fontSize: 12, fill: COLORS.gray }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip cursor={{ fill: '#f6f6f6' }} contentStyle={{ borderRadius: 12, border: '1px solid #eee', fontSize: 13 }} />
                      <Bar dataKey="valor" name="Casos" radius={[6, 6, 0, 0]} fill={COLORS.green} barSize={26} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* Índice de siniestralidad comparado */}
              <Card title="Índice de incidencia — cliente vs. límite admisible"
                action={<span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: '#FBE9E5', color: '#9A2A18' }}>Límite: 0,30</span>}>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={indiceComparado} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 12, fill: COLORS.gray }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: COLORS.gray }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #eee', fontSize: 13 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <ReferenceLine y={0.30} stroke={COLORS.danger} strokeDasharray="6 4" />
                    <Line type="monotone" dataKey="limite" name="Límite admisible" stroke={COLORS.danger} strokeWidth={1.5} strokeDasharray="6 4" dot={false} />
                    <Line type="monotone" dataKey="cliente" name="Índice del cliente" stroke={COLORS.green} strokeWidth={2.5} dot={{ r: 3, fill: COLORS.green }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              {/* Días perdidos + accidentes por puesto */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card title="Días perdidos por accidente">
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={diasPerdidos} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                      <XAxis dataKey="mes" tick={{ fontSize: 12, fill: COLORS.gray }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: COLORS.gray }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip formatter={(v: any) => `${v} días`} contentStyle={{ borderRadius: 12, border: '1px solid #eee', fontSize: 13 }} />
                      <Line type="monotone" dataKey="dias" name="Días perdidos" stroke={COLORS.warn} strokeWidth={2.5} dot={{ r: 3, fill: COLORS.warn }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                <Card title="Accidentes por puesto de trabajo">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={accidentesPorPuesto} layout="vertical" margin={{ top: 10, right: 24, left: 20, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="puesto" tick={{ fontSize: 12, fill: COLORS.grayDark }} axisLine={false} tickLine={false} width={120} />
                      <Tooltip cursor={{ fill: '#f6f6f6' }} contentStyle={{ borderRadius: 12, border: '1px solid #eee', fontSize: 13 }} />
                      <Bar dataKey="valor" name="Accidentes" radius={[0, 6, 6, 0]} barSize={20}>
                        {accidentesPorPuesto.map((e, i) => <Cell key={i} fill={e.valor >= 5 ? COLORS.danger : e.valor >= 3 ? COLORS.warn : COLORS.green} />)}
                        <LabelList dataKey="valor" position="right" style={{ fill: COLORS.grayDark, fontSize: 12, fontWeight: 700 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* Fila: cuerpo + documental */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card title="Partes del cuerpo afectadas">
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <div className="flex-1 min-w-0 w-full">
                      <BodyMap2 data={partesData} />
                    </div>
                    <div className="w-full sm:w-44 flex-shrink-0">
                      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: COLORS.gray }}>Detalle por zona</p>
                      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                        {Object.entries(partesData)
                          .filter(([, v]) => v > 0)
                          .sort((a, b) => b[1] - a[1])
                          .map(([key, v], _, arr) => {
                            const max = arr[0][1]
                            return (
                              <div key={key} className="flex items-center gap-2">
                                <span className="text-xs truncate" style={{ color: COLORS.grayDark, width: 78 }}>{PART_LABELS[key] ?? key}</span>
                                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.grayLight }}>
                                  <div className="h-full rounded-full" style={{ width: `${(v / max) * 100}%`, backgroundColor: parteHeat(v) }} />
                                </div>
                                <span className="text-xs font-bold w-4 text-right" style={{ color: COLORS.grayDark }}>{v}</span>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  </div>
                </Card>

                {documentalCard}
              </div>
            </div>
          )}

          {/* ══════════════ VISTA DOCUMENTACIÓN ══════════════ */}
          {view === 'documentacion' && (
            <div key="docs" className="ss-animate grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
              <div className="min-w-0 lg:col-span-1">{documentalCard}</div>
              <div className="min-w-0 lg:col-span-2">{docListCard}</div>
            </div>
          )}

          <p className="text-center text-xs py-4" style={{ color: COLORS.gray }}>
            Safety Services · Ing. Eduardo Klopp · Higiene y Seguridad en el Trabajo
          </p>
        </main>
      </div>

      <DemoSwitcher current="cliente" />

      {/* ════════ MODAL INFORME PDF ════════ */}
      {informeOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="no-print fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setInformeOpen(false)} />
          <div className="relative min-h-full flex flex-col items-center py-8 px-4">
            {/* Barra de acciones */}
            <div className="no-print sticky top-0 z-10 mb-4 flex items-center gap-3 bg-white rounded-2xl shadow-lg px-4 py-3">
              <p className="text-sm font-semibold" style={{ color: COLORS.grayDark }}>Vista previa del informe</p>
              <button onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90" style={{ backgroundColor: COLORS.green }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Guardar como PDF
              </button>
              <button onClick={() => setInformeOpen(false)} className="p-2 rounded-xl hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={COLORS.gray} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {/* Hoja del informe */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-[820px]">
              <InformeReporte empresa={empresaName} docs={docsSource} accidentes={totalAccidentesF}
                indices={idxF} porArea={areaData} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
