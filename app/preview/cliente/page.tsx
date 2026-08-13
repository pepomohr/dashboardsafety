'use client'

import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, AreaChart, Area, CartesianGrid, LabelList,
} from 'recharts'
import { COLORS, statusStyle } from '@/lib/theme'
import { PART_LABELS, DocItem } from '@/lib/mockData'
import {
  supabaseReady, datosCliente, urlPublicaDocumento, DocRow, AccRow,
} from '@/lib/supabase'
import { agregarAccidentes } from '@/lib/dashboard'
import BodyMap2 from '@/components/BodyMap2'
import Sidebar, { NavItem } from '@/components/Sidebar'
import Logo from '@/components/Logo'
import InformeReporte from '@/components/InformeReporte'
import { descargarComoPDF } from '@/lib/pdf'

function parteHeat(count: number) {
  if (count <= 0) return COLORS.grayLight
  if (count <= 2) return '#C7E3AC'
  if (count <= 4) return COLORS.warn
  return COLORS.danger
}
const CAT_COLORS = [COLORS.green, COLORS.warn, COLORS.danger, COLORS.grayMid, COLORS.greenDark]

function estadoDoc(venc: string | null): DocItem['status'] {
  if (!venc) return 'valid'
  const dias = Math.round((new Date(venc + 'T00:00:00').getTime() - Date.now()) / 86400000)
  return dias <= 0 ? 'expired' : dias <= 30 ? 'expiring' : 'valid'
}

function Donut({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <p className="text-xs py-8 text-center" style={{ color: COLORS.grayMid }}>Sin datos</p>
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

// El cliente entra con el link secreto (?t=token) que le manda el admin. Sin contraseña.
export default function PreviewClienteDashboard() {
  const [view, setView] = useState('dashboard')
  const [anio, setAnio] = useState<string>('todos')
  const [bellOpen, setBellOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [informeOpen, setInformeOpen] = useState(false)
  const [pdfGenerando, setPdfGenerando] = useState(false)

  const [empresaName, setEmpresaName] = useState('Mi empresa')
  const [trabajadores, setTrabajadores] = useState<number | null>(null)
  const [docs, setDocs] = useState<DocRow[]>([])
  const [accs, setAccs] = useState<AccRow[]>([])
  const [cargando, setCargando] = useState(true)
  const [sinAcceso, setSinAcceso] = useState(false)

  // Cargar los datos con el token secreto del link (?t=…). Sin login.
  // El token se GUARDA en el dispositivo, así la app instalada (que abre sin el
  // ?t=) sigue funcionando. Y se refresca solo (polling) para ver cambios en vivo.
  useEffect(() => {
    if (!supabaseReady) { setCargando(false); return }

    // 1) token + sucursal del link, o los que quedaron guardados (app instalada)
    const params = new URLSearchParams(window.location.search)
    const enUrl = params.get('t')
    const sucUrl = params.get('s')
    let token = enUrl
    let suc = sucUrl
    try {
      if (enUrl) { localStorage.setItem('ss_token', enUrl); localStorage.setItem('ss_suc', sucUrl || '') }
      else { token = localStorage.getItem('ss_token'); suc = localStorage.getItem('ss_suc') }
    } catch {}
    if (!token) { setSinAcceso(true); setCargando(false); return }
    const tk = token
    const sucFiltro = suc || null

    let vivo = true
    async function traer(primera: boolean) {
      const data = await datosCliente(tk)
      if (!vivo) return
      if (!data?.empresa) {
        if (primera) { setSinAcceso(true); setCargando(false) }
        return
      }
      // Si el link trae una sucursal, mostrar SOLO lo de esa sucursal
      const sucNombre = sucFiltro ? data.sucursales.find(s => s.id === sucFiltro)?.name : null
      setEmpresaName(sucNombre ? `${data.empresa.name} · ${sucNombre}` : data.empresa.name)
      setTrabajadores(data.empresa.trabajadores ?? null)
      setDocs(sucFiltro ? data.documentos.filter(d => d.sucursal_id === sucFiltro) : data.documentos)
      setAccs(sucFiltro ? data.accidentes.filter(a => a.sucursal_id === sucFiltro) : data.accidentes)
      if (primera) setCargando(false)
    }

    traer(true)
    // Refresco casi instantáneo: cada 5s, pero SOLO con la app al frente
    // (no gasta batería/datos en segundo plano). Al volver, refresca al toque.
    const intervalo = setInterval(() => { if (document.visibilityState === 'visible') traer(false) }, 5000)
    const alVolver = () => { if (document.visibilityState === 'visible') traer(false) }
    document.addEventListener('visibilitychange', alVolver)
    window.addEventListener('focus', alVolver)
    return () => {
      vivo = false
      clearInterval(intervalo)
      document.removeEventListener('visibilitychange', alVolver)
      window.removeEventListener('focus', alVolver)
    }
  }, [])

  // Años disponibles según los accidentes reales
  const anios = Array.from(new Set(accs.map(a => (a.fecha || '').slice(0, 4)).filter(Boolean))).sort().reverse()
  const ag = agregarAccidentes(accs, anio === 'todos' ? null : anio, trabajadores)

  // Documental
  const total = docs.length
  const conEstado = docs.map(d => ({ ...d, status: estadoDoc(d.fecha_vencimiento) }))
  const vig = conEstado.filter(d => d.status === 'valid').length
  const exp = conEstado.filter(d => d.status === 'expiring').length
  const ven = conEstado.filter(d => d.status === 'expired').length
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0)
  const daysTo = (iso: string | null) => iso ? Math.round((new Date(iso + 'T00:00:00').getTime() - Date.now()) / 86400000) : 99999
  const docsConDias = conEstado.map(d => ({ ...d, days: daysTo(d.fecha_vencimiento) }))
  const urgente = docsConDias.filter(d => d.fecha_vencimiento).sort((a, b) => a.days - b.days)[0]
  const alertas = docsConDias.filter(d => d.fecha_vencimiento && d.days <= 30).sort((a, b) => a.days - b.days)

  // Para el informe (usa DocItem)
  const docsInforme: DocItem[] = conEstado.map((d, i) => ({
    id: i, name: d.tipo, status: d.status, expiry: d.fecha_vencimiento || '', desvio: 'sin', note: d.nota || undefined,
  }))

  const navItems: NavItem[] = NAV.map(it => it.id === 'documentacion' && ven > 0 ? { ...it, hint: String(ven) } : it)

  async function descargarInforme() {
    const nodo = document.getElementById('informe')
    if (!nodo) return
    setPdfGenerando(true)
    await descargarComoPDF(nodo, `Informe ${empresaName}`)
    setPdfGenerando(false)
  }

  // ── Tarjeta de estado documental ──
  const documentalCard = (
    <Card title="Estado de la documentación"
      action={<span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: COLORS.greenLight, color: COLORS.greenDark }}>{vig}/{total} vigentes</span>}>
      <div className="flex flex-col items-center">
        <div className="w-full mb-3">
          <div className="flex h-6 w-full rounded-full overflow-hidden" style={{ backgroundColor: COLORS.grayLight }}>
            {vig > 0 && <div style={{ width: `${pct(vig)}%`, backgroundColor: COLORS.green }} />}
            {exp > 0 && <div style={{ width: `${pct(exp)}%`, backgroundColor: COLORS.warn }} />}
            {ven > 0 && <div style={{ width: `${pct(ven)}%`, backgroundColor: COLORS.danger }} />}
          </div>
          <p className="text-center text-sm font-bold mt-2" style={{ color: COLORS.grayDark }}>
            {total === 0 ? 'Sin documentación cargada' : `${vig} de ${total} documentos vigentes`}
          </p>
        </div>
        {urgente && (() => {
          const us = statusStyle(urgente.status); const venc = urgente.days < 0
          return (
            <div className="w-full rounded-xl px-4 py-3 text-center" style={{ backgroundColor: us.bg }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: us.text }}>{venc ? '⚠ Requiere atención' : 'Próximo a vencer'}</p>
              <p className="text-sm font-bold mt-0.5 leading-tight" style={{ color: us.text }}>{urgente.tipo}</p>
              <p className="text-xs mt-0.5" style={{ color: us.text }}>
                {venc ? `Venció hace ${Math.abs(urgente.days)} días` : urgente.days === 0 ? 'Vence hoy' : `Vence en ${urgente.days} días`}
              </p>
            </div>
          )
        })()}
        <div className="grid grid-cols-3 gap-3 w-full mt-3">
          {[['Vigentes', vig, COLORS.greenLight, COLORS.greenDark], ['Por vencer', exp, '#FBF3DD', '#8A6A12'], ['Vencidos', ven, '#FBE9E5', '#9A2A18']].map(([l, v, bg, c]) => (
            <div key={l as string} className="text-center rounded-xl py-3" style={{ backgroundColor: bg as string }}>
              <p className="text-2xl font-bold" style={{ color: c as string }}>{v as number}</p>
              <p className="text-xs font-semibold" style={{ color: c as string }}>{l as string}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )

  // ── Lista de documentos ──
  const docListCard = (
    <Card title="Documentación — detalle">
      {total === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: COLORS.gray }}>Todavía no hay documentación cargada.</p>
      ) : (
        <div className="space-y-1">
          {docsConDias.map(doc => {
            const s = statusStyle(doc.status)
            const barPct = doc.status === 'expired' ? 100 : doc.fecha_vencimiento ? Math.max(5, Math.min(100, Math.round((doc.days / 365) * 100))) : 0
            return (
              <div key={doc.id} className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.hex }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate" style={{ color: COLORS.grayDark }}>{doc.tipo}</p>
                  <p className="text-xs" style={{ color: COLORS.gray }}>
                    {!doc.fecha_vencimiento ? 'Sin vencimiento' : doc.status === 'expired' ? `Venció hace ${Math.abs(doc.days)} días` : doc.days === 0 ? 'Vence hoy' : `Vence en ${doc.days} días`}
                    {doc.fecha_vencimiento && ` · ${doc.fecha_vencimiento.split('-').reverse().join('/')}`}
                    {doc.nota && ` · ${doc.nota}`}
                  </p>
                  {doc.fecha_vencimiento && (
                    <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.grayLight }}>
                      <div className="h-full rounded-full" style={{ width: `${barPct}%`, backgroundColor: s.hex }} />
                    </div>
                  )}
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0" style={{ backgroundColor: s.bg, color: s.text }}>{s.label}</span>
                {doc.archivo_path && (() => {
                  const url = urlPublicaDocumento(doc.archivo_path)
                  return url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" download
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg flex-shrink-0 text-white text-xs font-semibold"
                      style={{ backgroundColor: COLORS.green }} title="Descargar documento">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span className="hidden sm:inline">Descargar</span>
                    </a>
                  ) : null
                })()}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )

  const mesMax = ag.porMes.length ? ag.porMes.reduce((a, b) => (b.accidentes > a.accidentes ? b : a)) : { mes: '—', accidentes: 0 }

  // Sin token válido: no hay acceso (el link es la llave)
  if (sinAcceso) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: COLORS.bg }}>
        <Logo size={64} />
        <h1 className="font-display text-xl font-extrabold mt-4" style={{ color: COLORS.grayDark }}>
          <span style={{ color: COLORS.green }}>Safety</span> <span style={{ color: COLORS.gray }}>Services</span>
        </h1>
        <p className="text-sm mt-3 max-w-xs" style={{ color: COLORS.gray }}>
          Para ver tu tablero, abrí el <b>link</b> que te envió Safety Services. Si el link no funciona, pedile a tu asesor que te lo reenvíe.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: COLORS.bg }}>
      <Sidebar items={navItems} active={view} onChange={setView} role="Cliente" empresa={empresaName}
        open={navOpen} onClose={() => setNavOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-4 md:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setNavOpen(true)} className="md:hidden w-10 h-10 -ml-1 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors" aria-label="Menú">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={COLORS.grayDark} strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div className="md:hidden"><Logo size={34} /></div>
              <div>
                <h1 className="font-display font-extrabold text-lg leading-none" style={{ color: COLORS.grayDark }}>{view === 'dashboard' ? 'Dashboard' : 'Documentación'}</h1>
                <p className="text-xs mt-1" style={{ color: COLORS.gray }}>{empresaName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <button onClick={() => setBellOpen(o => !o)} className="relative w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5 ss-bell" fill="none" viewBox="0 0 24 24" stroke={COLORS.grayDark} strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  {alertas.length > 0 && <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ backgroundColor: COLORS.danger }}>{alertas.length}</span>}
                </button>
                {bellOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 max-h-96 overflow-y-auto">
                    <div className="px-4 py-3 border-b border-gray-100 sticky top-0 bg-white"><p className="text-sm font-bold" style={{ color: COLORS.grayDark }}>Notificaciones</p></div>
                    {alertas.length === 0 ? (
                      <div className="px-4 py-6 text-center"><p className="text-sm" style={{ color: COLORS.gray }}>Todo en orden ✓</p></div>
                    ) : alertas.map(n => {
                      const venc = n.days < 0
                      return (
                        <div key={n.id} className="px-4 py-3 border-b border-gray-50 flex gap-2.5">
                          <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: venc ? COLORS.danger : COLORS.warn }} />
                          <div>
                            <p className="text-sm" style={{ color: COLORS.grayDark }}>{n.tipo} {venc ? 'venció' : 'está por vencer'}</p>
                            <p className="text-xs mt-0.5" style={{ color: COLORS.gray }}>{venc ? `Hace ${Math.abs(n.days)} días` : n.days === 0 ? 'Vence hoy' : `Vence en ${n.days} días`}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              <button onClick={() => setInformeOpen(true)} className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90" style={{ backgroundColor: COLORS.green }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Descargar informe PDF
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl w-full mx-auto px-4 md:px-6 py-6 space-y-5">
          {cargando ? (
            <p className="text-sm py-16 text-center" style={{ color: COLORS.gray }}>Cargando tu tablero…</p>
          ) : (<>

          {/* ══════════════ DASHBOARD ══════════════ */}
          {view === 'dashboard' && (
            <div key="dash" className="ss-animate space-y-5">
              {/* Filtro por año (solo si hay accidentes de más de un año) */}
              {anios.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-end gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: COLORS.gray }}>Año</label>
                    <select value={anio} onChange={e => setAnio(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2" style={{ minWidth: 130, color: COLORS.grayDark }}>
                      <option value="todos">Todos los años</option>
                      {anios.map(a => <option key={a} value={a} style={{ color: COLORS.grayDark }}>{a}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Índices */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 border-l-4" style={{ borderLeftColor: COLORS.grayDark }}>
                  <p className="text-3xl font-bold" style={{ color: COLORS.grayDark }}>{ag.total}</p>
                  <p className="text-sm font-semibold mt-1" style={{ color: COLORS.grayDark }}>Accidentes acumulados</p>
                  <p className="text-xs mt-0.5" style={{ color: COLORS.gray }}>{anio === 'todos' ? 'Total' : `Año ${anio}`}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 border-l-4" style={{ borderLeftColor: COLORS.warn }}>
                  <p className="text-3xl font-bold" style={{ color: COLORS.warn }}>{ag.incidencia !== null ? ag.incidencia.toFixed(2) : '—'}</p>
                  <p className="text-sm font-semibold mt-1" style={{ color: COLORS.grayDark }}>Índice de incidencia</p>
                  <p className="text-xs mt-0.5" style={{ color: COLORS.gray }}>{ag.incidencia !== null ? 'por 100 trabajadores' : 'sin dotación cargada'}</p>
                </div>
              </div>

              {ag.total === 0 ? (
                <Card title="Siniestralidad">
                  <div className="py-10 text-center">
                    <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: COLORS.greenLight }}>
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke={COLORS.green} strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-sm font-semibold" style={{ color: COLORS.grayDark }}>Sin accidentes registrados</p>
                    <p className="text-xs mt-1" style={{ color: COLORS.gray }}>Es una buena noticia. Cuando haya registros, acá aparecen los gráficos.</p>
                  </div>
                </Card>
              ) : (<>
                <Card title="Accidentes por mes"
                  action={<span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: COLORS.greenLight, color: COLORS.greenDark }}>Pico: {mesMax.mes} ({mesMax.accidentes})</span>}>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={ag.porMes} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs><linearGradient id="gAcc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={COLORS.green} stopOpacity={0.4} /><stop offset="100%" stopColor={COLORS.green} stopOpacity={0.02} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                      <XAxis dataKey="mes" tick={{ fontSize: 12, fill: COLORS.gray }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: COLORS.gray }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #eee', fontSize: 13 }} />
                      <Area type="monotone" dataKey="accidentes" name="Accidentes" stroke={COLORS.green} fill="url(#gAcc)" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <Card title="Accidentes por área">
                    {ag.porArea.length === 0 ? <p className="text-xs py-8 text-center" style={{ color: COLORS.grayMid }}>Sin datos</p> : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={ag.porArea} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                        <XAxis dataKey="area" tick={{ fontSize: 11, fill: COLORS.gray }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: COLORS.gray }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip cursor={{ fill: '#f6f6f6' }} contentStyle={{ borderRadius: 12, border: '1px solid #eee', fontSize: 13 }} />
                        <Bar dataKey="valor" name="Accidentes" radius={[6, 6, 0, 0]}>{ag.porArea.map((e, i) => <Cell key={i} fill={e.valor >= 10 ? COLORS.danger : e.valor >= 6 ? COLORS.warn : COLORS.green} />)}</Bar>
                      </BarChart>
                    </ResponsiveContainer>)}
                  </Card>
                  <Card title="Accidentes por turno">
                    {ag.porTurno.length === 0 ? <p className="text-xs py-8 text-center" style={{ color: COLORS.grayMid }}>Sin datos</p> : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={ag.porTurno} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="turno" tick={{ fontSize: 13, fill: COLORS.grayDark }} axisLine={false} tickLine={false} width={70} />
                        <Tooltip formatter={(v: any) => `${v}%`} cursor={{ fill: '#f6f6f6' }} contentStyle={{ borderRadius: 12, border: '1px solid #eee', fontSize: 13 }} />
                        <Bar dataKey="valor" name="% de accidentes" radius={[0, 6, 6, 0]} barSize={28}>
                          {ag.porTurno.map((e, i) => <Cell key={i} fill={e.turno === 'Tarde' ? COLORS.green : COLORS.grayMid} />)}
                          <LabelList dataKey="valor" position="right" formatter={(v: any) => `${v}%`} style={{ fill: COLORS.grayDark, fontSize: 13, fontWeight: 700 }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>)}
                  </Card>
                  <Card title="Tipo de lesión">
                    {ag.porLesion.length === 0 ? <p className="text-xs py-8 text-center" style={{ color: COLORS.grayMid }}>Sin datos</p> : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={ag.porLesion} margin={{ top: 10, right: 10, left: -20, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                        <XAxis dataKey="tipo" tick={{ fontSize: 10, fill: COLORS.gray }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" interval={0} />
                        <YAxis tick={{ fontSize: 12, fill: COLORS.gray }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip cursor={{ fill: '#f6f6f6' }} contentStyle={{ borderRadius: 12, border: '1px solid #eee', fontSize: 13 }} />
                        <Bar dataKey="valor" name="Casos" radius={[6, 6, 0, 0]} fill={COLORS.green} barSize={26} />
                      </BarChart>
                    </ResponsiveContainer>)}
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <Card title="Partes del cuerpo afectadas">
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      <div className="flex-1 min-w-0 w-full"><BodyMap2 data={ag.partes} /></div>
                      <div className="w-full sm:w-44 flex-shrink-0">
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: COLORS.gray }}>Detalle por zona</p>
                        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                          {Object.entries(ag.partes).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([key, v], _, arr) => {
                            const max = arr[0][1]
                            return (
                              <div key={key} className="flex items-center gap-2">
                                <span className="text-xs truncate" style={{ color: COLORS.grayDark, width: 78 }}>{PART_LABELS[key] ?? key}</span>
                                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.grayLight }}><div className="h-full rounded-full" style={{ width: `${(v / max) * 100}%`, backgroundColor: parteHeat(v) }} /></div>
                                <span className="text-xs font-bold w-4 text-right" style={{ color: COLORS.grayDark }}>{v}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </Card>
                  <Card title="Gravedad de las lesiones"><Donut data={ag.gravedad} /></Card>
                </div>
              </>)}

              {documentalCard}
            </div>
          )}

          {/* ══════════════ DOCUMENTACIÓN ══════════════ */}
          {view === 'documentacion' && (
            <div key="docs" className="ss-animate grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
              <div className="min-w-0 lg:col-span-1">{documentalCard}</div>
              <div className="min-w-0 lg:col-span-2">{docListCard}</div>
            </div>
          )}

          <p className="text-center text-xs py-4" style={{ color: COLORS.gray }}>Safety Services · Ing. Eduardo Klopp · Higiene y Seguridad en el Trabajo</p>
          </>)}
        </main>
      </div>

      {/* ════════ MODAL INFORME PDF ════════ */}
      {informeOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="no-print fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setInformeOpen(false)} />
          <div className="relative min-h-full flex flex-col items-center py-8 px-4">
            <div className="no-print sticky top-0 z-10 mb-4 flex items-center gap-3 bg-white rounded-2xl shadow-lg px-4 py-3">
              <p className="text-sm font-semibold" style={{ color: COLORS.grayDark }}>Vista previa del informe</p>
              <button onClick={descargarInforme} disabled={pdfGenerando} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: COLORS.green }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                {pdfGenerando ? 'Generando…' : 'Descargar PDF'}
              </button>
              <button onClick={() => setInformeOpen(false)} className="p-2 rounded-xl hover:bg-gray-100"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={COLORS.gray} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-[820px]">
              <InformeReporte empresa={empresaName} docs={docsInforme} accidentes={ag.total}
                indices={{ frecuencia: 0, gravedad: 0, incidencia: ag.incidencia ?? 0 }} porArea={ag.porArea} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
