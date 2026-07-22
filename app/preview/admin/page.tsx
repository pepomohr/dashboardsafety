'use client'

import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, CartesianGrid, Legend, PieChart, Pie, LineChart, Line, ReferenceLine, LabelList,
} from 'recharts'
import { COLORS, statusStyle } from '@/lib/theme'
import {
  documents, DocItem, PART_LABELS,
  accidentesPorTurno, diagnosticos, investigacion,
  gravedadLesiones, circunstancia, causas, origen, accidentesPorPuesto, diasPerdidos, indiceComparado,
} from '@/lib/mockData'
import {
  empresas as seedEmpresas, Empresa,
  empresaDocs, empresaAccidentesPorMes, empresaAccidentesPorArea, empresaPartes, empresaIndices,
} from '@/lib/empresas'
import { supabase, uploadLogo, supabaseReady, signOut } from '@/lib/supabase'
import LoginGate from '@/components/LoginGate'
import Card from '@/components/Card'
import Gauge from '@/components/Gauge'
import BodyMap2 from '@/components/BodyMap2'
import Donut from '@/components/Donut'
import EmpresaCard from '@/components/EmpresaCard'
import EmpresaLogo from '@/components/EmpresaLogo'
import CargaAccidentes from '@/components/CargaAccidentes'
import InformeReporte from '@/components/InformeReporte'
import Sidebar, { NavItem } from '@/components/Sidebar'
import Logo from '@/components/Logo'
import DemoSwitcher from '@/components/DemoSwitcher'
import EnviarAppButton from '@/components/EnviarAppButton'

const COLOR_SWATCHES = ['#E2001A', '#1E9BD7', '#F57C00', '#2E7D32', '#7E57C2', '#EC407A', '#00897B', '#3D3D3D']
const DOC_TYPES = documents.map(d => d.name)

const NAV: NavItem[] = [
  { id: 'clientes', label: 'Clientes', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-3-1.5" />
    </svg>
  ) },
]

function fmtDate(d: string) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function urgencyValue(days: number) {
  if (days <= 0) return 1
  if (days <= 30) return 0.75 + ((30 - days) / 30) * 0.25
  if (days <= 90) return 0.5 + ((90 - days) / 60) * 0.25
  if (days <= 365) return ((365 - days) / 275) * 0.5
  return 0
}

// Parámetros de demo para el dashboard (mientras no estén migrados docs/accidentes reales)
const DEMO_PARAMS: Record<string, { severidad: number; factor: number }> = {
  comafi: { severidad: 3, factor: 0.7 },
  belgrano: { severidad: 0, factor: 1 },
}
function sucParams(name: string) {
  const n = (name || '').toLowerCase()
  if (n.includes('lomas')) return { severidad: 3, factor: 0.9 }
  if (n.includes('ramos')) return { severidad: 1, factor: 0.4 }
  return { severidad: 0, factor: 1 }
}
// Convierte una fila de la base (empresas) a nuestro tipo Empresa
function dbToEmpresa(e: any, sucs: any[] = []): Empresa {
  const demo = DEMO_PARAMS[e.slug] || { severidad: 0, factor: 1 }
  return {
    id: e.id, name: e.name, slug: e.slug, color: e.color || '#6FB63F',
    rubro: e.rubro || 'Sin especificar', sede: e.sede || 'Sin sede', isClient: !!e.is_client,
    logoUrl: e.logo_url || undefined, severidad: demo.severidad, factor: demo.factor,
    sucursales: sucs.length ? sucs.map(s => ({ id: s.id, name: s.name, ...sucParams(s.name) })) : undefined,
  }
}

// Envoltura: con Supabase conectado pide login (admin); sin conectar, muestra la demo.
export default function AdminPage() {
  return supabaseReady ? <LoginGate requireAdmin><AdminPanel /></LoginGate> : <AdminPanel />
}

function AdminPanel() {
  const [empresasList, setEmpresasList] = useState<Empresa[]>(seedEmpresas)
  const [selected, setSelected] = useState<Empresa | null>(null)
  const [tab, setTab] = useState<'dashboard' | 'carga' | 'accidentes'>('dashboard')
  const [docsState, setDocsState] = useState<DocItem[]>([])
  const [sucursalId, setSucursalId] = useState<string | null>(null)
  const [navOpen, setNavOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [uploadOk, setUploadOk] = useState(false)
  const [informeOpen, setInformeOpen] = useState(false)

  // Form de alta de empresa
  const [fName, setFName] = useState('')
  const [fRubro, setFRubro] = useState('')
  const [fSede, setFSede] = useState('')
  const [fColor, setFColor] = useState(COLOR_SWATCHES[0])
  const [fClient, setFClient] = useState(true)
  const [fLogo, setFLogo] = useState<string | null>(null)       // vista previa (data URL)
  const [fLogoFile, setFLogoFile] = useState<File | null>(null) // archivo real (para subir a Supabase)
  const [creando, setCreando] = useState(false)
  const [logoSubiendo, setLogoSubiendo] = useState(false)

  // Cambiar el logo de un cliente ya existente (se guarda en Supabase Storage)
  async function cambiarLogoEmpresa(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0]
    if (!file || !selected) return
    setLogoSubiendo(true)
    let url: string | null = supabaseReady ? await uploadLogo(file, selected.slug) : null
    if (url && supabase) {
      await supabase.from('empresas').update({ logo_url: url }).eq('id', selected.id)
    }
    if (!url) {
      // Sin Supabase: vista previa local (no persiste)
      url = await new Promise<string>(res => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(file) })
    }
    const nuevo = url
    setSelected(s => (s ? { ...s, logoUrl: nuevo } : s))
    setEmpresasList(l => l.map(x => (x.id === selected.id ? { ...x, logoUrl: nuevo } : x)))
    setLogoSubiendo(false)
    ev.target.value = ''
  }

  // Cargar las empresas desde Supabase (cuando está conectado)
  useEffect(() => {
    if (!supabase) return
    ;(async () => {
      const { data: emps } = await supabase!.from('empresas').select('*').order('created_at', { ascending: true })
      if (!emps) return
      const { data: sucs } = await supabase!.from('sucursales').select('*')
      setEmpresasList(emps.map(e => dbToEmpresa(e, (sucs || []).filter((s: any) => s.empresa_id === e.id))))
    })()
  }, [])

  function onLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFLogoFile(file)
    const reader = new FileReader()
    reader.onload = () => setFLogo(String(reader.result))
    reader.readAsDataURL(file)
  }

  function enterEmpresa(e: Empresa) {
    setSelected(e)
    setTab('dashboard')
    const suc = e.sucursales?.[0] ?? null
    setSucursalId(suc?.id ?? null)
    setDocsState(empresaDocs(suc?.severidad ?? e.severidad))
    setUploadOk(false)
  }

  function changeSucursal(e: Empresa, id: string) {
    const suc = e.sucursales?.find(s => s.id === id)
    setSucursalId(id)
    setDocsState(empresaDocs(suc?.severidad ?? e.severidad))
    setUploadOk(false)
  }

  // Sucursal activa y sus parámetros (o la empresa si no tiene sucursales)
  const branch = selected?.sucursales?.find(s => s.id === sucursalId) ?? null
  const activeFactor = branch?.factor ?? selected?.factor ?? 1

  async function crearEmpresa() {
    if (!fName.trim() || creando) return
    setCreando(true)
    const slug = (fName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) || `e${Date.now()}`
    // El logo: si Supabase está conectado, se sube al Storage; si no, se usa la vista previa local.
    let logoUrl: string | undefined = fLogo || undefined
    if (fLogoFile && supabaseReady) {
      const url = await uploadLogo(fLogoFile, slug)
      if (url) logoUrl = url
    }
    if (supabaseReady && supabase) {
      // Guardar en la base de datos
      const { data, error } = await supabase.from('empresas')
        .insert({ name: fName.trim(), slug, color: fColor, rubro: fRubro.trim() || 'Sin especificar', sede: fSede.trim() || 'Sin sede', is_client: fClient, logo_url: logoUrl })
        .select().single()
      if (error || !data) { alert('No se pudo crear el cliente: ' + (error?.message || '')); setCreando(false); return }
      setEmpresasList(l => [dbToEmpresa(data, []), ...l])
    } else {
      // Demo local (sin Supabase)
      const nueva: Empresa = {
        id: slug, name: fName.trim(), slug,
        color: fColor, rubro: fRubro.trim() || 'Sin especificar', sede: fSede.trim() || 'Sin sede', isClient: fClient,
        logoUrl, severidad: 0, factor: 1,
      }
      setEmpresasList(l => [nueva, ...l])
    }
    setCreateOpen(false)
    setFName(''); setFRubro(''); setFSede(''); setFColor(COLOR_SWATCHES[0]); setFClient(true); setFLogo(null); setFLogoFile(null)
    setCreando(false)
  }

  // Form de carga de documento
  const [dTipo, setDTipo] = useState('')
  const [dEmision, setDEmision] = useState('')
  const [dVenc, setDVenc] = useState('')

  function cargarDoc() {
    if (!dTipo || !dVenc) return
    const today = new Date()
    const days = Math.round((new Date(dVenc + 'T00:00:00').getTime() - today.getTime()) / 86400000)
    const status: DocItem['status'] = days <= 0 ? 'expired' : days <= 30 ? 'expiring' : 'valid'
    const nuevo: DocItem = { id: Date.now(), name: dTipo, status, expiry: dVenc, desvio: 'sin' }
    setDocsState(d => [nuevo, ...d.filter(x => x.name !== dTipo)])
    setUploadOk(true)
    setDTipo(''); setDEmision(''); setDVenc('')
    setTimeout(() => setUploadOk(false), 2500)
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: COLORS.bg }}>
      <Sidebar items={NAV} active="clientes" onChange={() => setSelected(null)} role="Administrador" empresa="Safety Services"
        open={navOpen} onClose={() => setNavOpen(false)}
        extra={selected ? <EnviarAppButton slug={selected.slug} sucursal={branch?.id ?? undefined} /> : undefined} />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* TOP BAR */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-4 md:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => setNavOpen(true)} className="md:hidden w-10 h-10 -ml-1 rounded-xl flex items-center justify-center hover:bg-gray-100" aria-label="Menú">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={COLORS.grayDark} strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="md:hidden"><Logo size={34} /></div>
              {selected ? (
                <button onClick={() => setSelected(null)} className="flex items-center gap-2 min-w-0 group">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke={COLORS.gray} strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  <div className="min-w-0 text-left">
                    <h1 className="font-display font-extrabold text-lg leading-none truncate" style={{ color: COLORS.grayDark }}>{selected.name}</h1>
                    <p className="text-xs mt-0.5" style={{ color: COLORS.gray }}>{selected.sede}</p>
                  </div>
                </button>
              ) : (
                <div>
                  <h1 className="font-display font-extrabold text-lg leading-none" style={{ color: COLORS.grayDark }}>Mis clientes</h1>
                  <p className="text-xs mt-1" style={{ color: COLORS.gray }}>{empresasList.length} empresas</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {!selected && (
                <button onClick={() => setCreateOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: COLORS.green }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline">Nuevo cliente</span>
                </button>
              )}
              {supabaseReady && (
                <button onClick={() => signOut()} title="Cerrar sesión"
                  className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={COLORS.gray} strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-7xl w-full mx-auto px-4 md:px-6 py-6">

          {/* ══════════ GRILLA DE EMPRESAS ══════════ */}
          {!selected && (
            <div className="ss-animate">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {empresasList.map(e => <EmpresaCard key={e.id} empresa={e} onEnter={enterEmpresa} />)}
                {/* Card para agregar */}
                <button onClick={() => setCreateOpen(true)}
                  className="rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-2 py-10 transition-colors hover:bg-white min-h-[260px]"
                  style={{ borderColor: '#D6DAD4' }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: COLORS.greenLight }}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={COLORS.green} strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: COLORS.grayDark }}>Nuevo cliente</span>
                  <span className="text-xs" style={{ color: COLORS.gray }}>Dar de alta una empresa</span>
                </button>
              </div>
            </div>
          )}

          {/* ══════════ WORKSPACE DE EMPRESA ══════════ */}
          {selected && (
            <div className="ss-animate space-y-5">
              {/* Encabezado de empresa */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                <label className="relative cursor-pointer group flex-shrink-0" title="Cambiar logo del cliente">
                  <EmpresaLogo name={selected.name} color={selected.color} slug={selected.slug} logoUrl={selected.logoUrl} size={60} />
                  <span className="absolute inset-0 rounded-2xl flex items-center justify-center text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: 'rgba(0,0,0,.55)' }}>
                    {logoSubiendo ? '…' : 'Cambiar'}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={cambiarLogoEmpresa} disabled={logoSubiendo} />
                </label>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-xl font-extrabold" style={{ color: COLORS.grayDark }}>{selected.name}</h2>
                  <p className="text-sm" style={{ color: COLORS.gray }}>{selected.rubro} · {selected.sede}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="hidden sm:inline text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={selected.isClient
                      ? { backgroundColor: COLORS.greenLight, color: COLORS.greenDark }
                      : { backgroundColor: '#FBF3DD', color: '#8A6A12' }}>
                    {selected.isClient ? 'Cliente oficial de Safety Services' : 'Prospecto / Demo'}
                  </span>
                  <button onClick={() => setInformeOpen(true)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: COLORS.grayDark }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    <span className="hidden sm:inline">Informe PDF</span>
                  </button>
                </div>
              </div>

              {/* Selector de sucursal (si la empresa tiene varias) */}
              {selected.sucursales && selected.sucursales.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide mr-1" style={{ color: COLORS.gray }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={COLORS.gray} strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Sucursal
                  </span>
                  {selected.sucursales.map(s => {
                    const a = s.id === sucursalId
                    return (
                      <button key={s.id} onClick={() => changeSucursal(selected!, s.id)}
                        className="px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors border"
                        style={a ? { backgroundColor: selected.color, color: '#fff', borderColor: selected.color } : { backgroundColor: '#fff', color: COLORS.grayDark, borderColor: '#e5e7eb' }}>
                        {s.name}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-1 sm:gap-2 border-b border-gray-200">
                {([['dashboard', 'Dashboard'], ['accidentes', 'Accidentes'], ['carga', 'Documentación']] as const).map(([id, label]) => (
                  <button key={id} onClick={() => setTab(id)}
                    className="px-2.5 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold -mb-px border-b-2 transition-colors whitespace-nowrap"
                    style={tab === id
                      ? { borderColor: COLORS.green, color: COLORS.greenDark }
                      : { borderColor: 'transparent', color: COLORS.gray }}>
                    {label}
                  </button>
                ))}
              </div>

              {tab === 'dashboard' && <EmpresaDashboard factor={activeFactor} docs={docsState} />}
              {tab === 'accidentes' && <CargaAccidentes color={selected.color} />}
              {tab === 'carga' && (
                <CargaDocumentacion docs={docsState} tipo={dTipo} setTipo={setDTipo}
                  emision={dEmision} setEmision={setDEmision} venc={dVenc} setVenc={setDVenc}
                  onCargar={cargarDoc} uploadOk={uploadOk} color={selected.color} />
              )}
            </div>
          )}
        </main>
      </div>

      <DemoSwitcher current="admin" />

      {/* ══════════ MODAL ALTA EMPRESA ══════════ */}
      {createOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCreateOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md ss-animate overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-display font-bold text-lg" style={{ color: COLORS.grayDark }}>Nuevo cliente</h3>
              <button onClick={() => setCreateOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={COLORS.gray} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <Field label="Nombre de la empresa *">
                <input value={fName} onChange={e => setFName(e.target.value)} placeholder="Ej: Banco Comafi"
                  className="ss-input" style={{ color: COLORS.grayDark }} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Rubro">
                  <input value={fRubro} onChange={e => setFRubro(e.target.value)} placeholder="Industria…" className="ss-input" style={{ color: COLORS.grayDark }} />
                </Field>
                <Field label="Sede">
                  <input value={fSede} onChange={e => setFSede(e.target.value)} placeholder="Banfield" className="ss-input" style={{ color: COLORS.grayDark }} />
                </Field>
              </div>
              <Field label="Color de marca">
                <div className="flex gap-2 flex-wrap">
                  {COLOR_SWATCHES.map(c => (
                    <button key={c} onClick={() => setFColor(c)}
                      className="w-8 h-8 rounded-lg transition-transform hover:scale-110"
                      style={{ backgroundColor: c, outline: fColor === c ? `2px solid ${COLORS.grayDark}` : 'none', outlineOffset: 2 }} />
                  ))}
                </div>
              </Field>
              <Field label="Logo del cliente (opcional)">
                <div className="flex items-center gap-3">
                  {fLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fLogo} alt="logo" className="w-12 h-12 rounded-lg object-contain bg-white border border-gray-100 flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0" style={{ backgroundColor: fColor }}>
                      {(fName || 'C').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <label className="cursor-pointer px-3 py-2 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50" style={{ borderColor: '#e5e7eb', color: COLORS.grayDark }}>
                    {fLogo ? 'Cambiar imagen' : 'Subir imagen'}
                    <input type="file" accept="image/*" className="hidden" onChange={onLogoFile} />
                  </label>
                  {fLogo && <button type="button" onClick={() => { setFLogo(null); setFLogoFile(null) }} className="text-xs" style={{ color: COLORS.gray }}>Quitar</button>}
                </div>
              </Field>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={fClient} onChange={e => setFClient(e.target.checked)} className="w-4 h-4 accent-green-700" />
                <span className="text-sm" style={{ color: COLORS.grayDark }}>Marcar como cliente oficial</span>
              </label>
              {/* Preview mini */}
              <div className="rounded-xl overflow-hidden border border-gray-100">
                <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: fColor }}>
                  {fLogo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fLogo} alt="logo" className="w-10 h-10 rounded-lg object-contain bg-white/90 p-0.5 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-[10px] italic font-semibold" style={{ color: 'rgba(255,255,255,.85)' }}>
                      {fClient ? 'CLIENTE OFICIAL DE SAFETY SERVICES' : 'PROSPECTO · DEMO'}
                    </p>
                    <p className="font-display text-white font-extrabold truncate">{fName || 'Nombre de la empresa'}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setCreateOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200" style={{ color: COLORS.gray }}>Cancelar</button>
              <button onClick={crearEmpresa} disabled={creando} className="px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: COLORS.green }}>{creando ? 'Creando…' : 'Crear cliente'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODAL INFORME PDF (por empresa) ══════════ */}
      {informeOpen && selected && (() => {
        const accMes = empresaAccidentesPorMes(activeFactor)
        const totalAcc = accMes.reduce((s, m) => s + m.accidentes, 0)
        return (
          <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="no-print fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setInformeOpen(false)} />
            <div className="relative min-h-full flex flex-col items-center py-8 px-4">
              <div className="no-print sticky top-0 z-10 mb-4 flex items-center gap-3 bg-white rounded-2xl shadow-lg px-4 py-3">
                <p className="text-sm font-semibold" style={{ color: COLORS.grayDark }}>Informe de {selected.name}{branch ? ` · ${branch.name}` : ''}</p>
                <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90" style={{ backgroundColor: COLORS.green }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  Guardar como PDF
                </button>
                <button onClick={() => setInformeOpen(false)} className="p-2 rounded-xl hover:bg-gray-100">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={COLORS.gray} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-[820px]">
                <InformeReporte empresa={branch ? `${selected.name} — ${branch.name}` : selected.name} docs={docsState} accidentes={totalAcc}
                  indices={empresaIndices(activeFactor)} porArea={empresaAccidentesPorArea(activeFactor)} />
              </div>
            </div>
          </div>
        )
      })()}

      <style jsx global>{`
        .ss-input { width: 100%; padding: 0.6rem 0.85rem; border-radius: 0.6rem; border: 1px solid #e5e7eb; font-size: 0.875rem; outline: none; }
        .ss-input:focus { box-shadow: 0 0 0 2px ${COLORS.green}55; border-color: ${COLORS.green}; }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1" style={{ color: COLORS.gray }}>{label}</label>
      {children}
    </div>
  )
}

// ══════════════════════════ DASHBOARD DE LA EMPRESA ══════════════════════════
function EmpresaDashboard({ factor, docs }: { factor: number; docs: DocItem[] }) {
  const total = docs.length
  const vig = docs.filter(d => d.status === 'valid').length
  const exp = docs.filter(d => d.status === 'expiring').length
  const ven = docs.filter(d => d.status === 'expired').length

  const today = new Date()
  const daysTo = (iso: string) => Math.round((new Date(iso + 'T00:00:00').getTime() - today.getTime()) / 86400000)
  const urgente = docs.map(d => ({ ...d, days: daysTo(d.expiry) })).sort((a, b) => a.days - b.days)[0]
  const gaugeValue = urgente ? urgencyValue(urgente.days) : 0

  const accMes = empresaAccidentesPorMes(factor)
  const accArea = empresaAccidentesPorArea(factor)
  const partes = empresaPartes(factor)
  const idx = empresaIndices(factor)
  const totalAcc = accMes.reduce((s, m) => s + m.accidentes, 0)
  const sinInvestigar = Math.max(0, Math.round(5 * factor))
  const parteHeat = (c: number) => c <= 0 ? COLORS.grayLight : c <= 2 ? '#C7E3AC' : c <= 4 ? COLORS.warn : COLORS.danger
  const partesList = Object.entries(partes).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-5">
      {/* Alertas del admin */}
      {(ven > 0 || sinInvestigar > 0) && (
        <div className="rounded-2xl px-5 py-3.5 flex items-center gap-3 flex-wrap" style={{ backgroundColor: '#FBE9E5', border: '1px solid #F3C9C0' }}>
          <span className="text-xl">⚠️</span>
          <p className="text-sm font-semibold" style={{ color: '#9A2A18' }}>
            Atención:
            {ven > 0 && ` ${ven} documento${ven > 1 ? 's' : ''} vencido${ven > 1 ? 's' : ''}`}
            {ven > 0 && sinInvestigar > 0 && ' ·'}
            {sinInvestigar > 0 && ` ${sinInvestigar} accidentes sin investigar`}
          </p>
        </div>
      )}

      {/* Índices */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Accidentes acumulados', value: totalAcc, color: COLORS.grayDark },
          { label: 'Índice de incidencia', value: idx.incidencia.toFixed(2), color: COLORS.warn },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 border-l-4" style={{ borderLeftColor: k.color }}>
            <p className="text-3xl font-bold" style={{ color: k.color }}>{k.value}</p>
            <p className="text-sm font-semibold mt-1" style={{ color: COLORS.grayDark }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Mes + documental */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card title="Accidentes por mes" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={accMes} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="aMes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.green} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={COLORS.green} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: COLORS.gray }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: COLORS.gray }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #eee', fontSize: 13 }} />
              <Area type="monotone" dataKey="accidentes" name="Accidentes" stroke={COLORS.green} fill="url(#aMes)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Estado de la documentación"
          action={<span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: COLORS.greenLight, color: COLORS.greenDark }}>{vig}/{total}</span>}>
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
            {urgente && (() => {
              const us = statusStyle(urgente.status); const venc = urgente.days < 0
              return (
                <div className="w-full rounded-xl px-3 py-2.5 text-center" style={{ backgroundColor: us.bg }}>
                  <p className="text-xs font-semibold" style={{ color: us.text }}>{urgente.name}</p>
                  <p className="text-[11px]" style={{ color: us.text }}>{venc ? `Venció hace ${Math.abs(urgente.days)} días` : `Vence en ${urgente.days} días`}</p>
                </div>
              )
            })()}
            <div className="grid grid-cols-3 gap-2 w-full mt-3">
              {[['Vigentes', vig, COLORS.greenLight, COLORS.greenDark], ['Por vencer', exp, '#FBF3DD', '#8A6A12'], ['Vencidos', ven, '#FBE9E5', '#9A2A18']].map(([l, v, bg, c]) => (
                <div key={l as string} className="text-center rounded-xl py-2" style={{ backgroundColor: bg as string }}>
                  <p className="text-xl font-bold" style={{ color: c as string }}>{v as number}</p>
                  <p className="text-[10px] font-semibold" style={{ color: c as string }}>{l as string}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Área + turno + tipo de lesión */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Card title="Accidentes por área">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={accArea} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
              <XAxis dataKey="area" tick={{ fontSize: 11, fill: COLORS.gray }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: COLORS.gray }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: '#f6f6f6' }} contentStyle={{ borderRadius: 12, border: '1px solid #eee', fontSize: 13 }} />
              <Bar dataKey="valor" name="Accidentes" radius={[6, 6, 0, 0]}>
                {accArea.map((e, i) => <Cell key={i} fill={e.valor >= 10 ? COLORS.danger : e.valor >= 6 ? COLORS.warn : COLORS.green} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Accidentes por turno">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={accidentesPorTurno} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="turno" tick={{ fontSize: 13, fill: COLORS.grayDark }} axisLine={false} tickLine={false} width={70} />
              <Tooltip formatter={(v: any) => `${v}%`} cursor={{ fill: '#f6f6f6' }} contentStyle={{ borderRadius: 12, border: '1px solid #eee', fontSize: 13 }} />
              <Bar dataKey="valor" radius={[0, 6, 6, 0]} barSize={26}>
                {accidentesPorTurno.map((e, i) => <Cell key={i} fill={e.turno === 'Tarde' ? COLORS.green : COLORS.grayMid} />)}
                <LabelList dataKey="valor" position="right" formatter={(v: any) => `${v}%`} style={{ fill: COLORS.grayDark, fontSize: 12, fontWeight: 700 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Tipo de lesión">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={diagnosticos} margin={{ top: 10, right: 10, left: -20, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
              <XAxis dataKey="tipo" tick={{ fontSize: 10, fill: COLORS.gray }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 12, fill: COLORS.gray }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: '#f6f6f6' }} contentStyle={{ borderRadius: 12, border: '1px solid #eee', fontSize: 13 }} />
              <Bar dataKey="valor" name="Casos" radius={[6, 6, 0, 0]} fill={COLORS.green} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tortas — solo admin */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <Card title="Gravedad de las lesiones"><Donut data={gravedadLesiones.map(d => ({ label: d.tipo, value: d.valor }))} /></Card>
        <Card title="Circunstancia"><Donut data={circunstancia.map(d => ({ label: d.tipo, value: d.valor }))} /></Card>
        <Card title="Causas"><Donut data={causas.map(d => ({ label: d.tipo, value: d.valor }))} /></Card>
        <Card title="Origen del accidente"><Donut data={origen.map(d => ({ label: d.tipo, value: d.valor }))} /></Card>
      </div>

      {/* Investigación + índice comparado — solo admin */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card title="Investigación de accidentes"
          action={<span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: '#FBE9E5', color: '#9A2A18' }}>{sinInvestigar} sin investigar</span>}>
          <Donut data={investigacion.map(e => ({ label: e.estado, value: e.valor }))} />
        </Card>
        <Card title="Índice de incidencia — vs. límite admisible" className="lg:col-span-2"
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
      </div>

      {/* Días perdidos + puesto */}
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

      {/* Cuerpo + detalle por zona */}
      <Card title="Partes del cuerpo afectadas">
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="flex-1 min-w-0 w-full"><BodyMap2 data={partes} /></div>
          <div className="w-full sm:w-48 flex-shrink-0">
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: COLORS.gray }}>Detalle por zona</p>
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {partesList.length === 0 && <p className="text-xs" style={{ color: COLORS.grayMid }}>Sin lesiones registradas</p>}
              {partesList.map(([key, v], _, arr) => {
                const max = arr[0][1]
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs truncate" style={{ color: COLORS.grayDark, width: 84 }}>{PART_LABELS[key] ?? key}</span>
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
    </div>
  )
}

// ══════════════════════════ CARGA DE DOCUMENTACIÓN ══════════════════════════
function CargaDocumentacion({
  docs, tipo, setTipo, emision, setEmision, venc, setVenc, onCargar, uploadOk, color,
}: {
  docs: DocItem[]
  tipo: string; setTipo: (v: string) => void
  emision: string; setEmision: (v: string) => void
  venc: string; setVenc: (v: string) => void
  onCargar: () => void
  uploadOk: boolean
  color: string
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
      {/* Form */}
      <div className="lg:col-span-2">
        <Card title="Cargar documento">
          {uploadOk && (
            <div className="mb-4 rounded-xl px-4 py-3 flex items-center gap-2" style={{ backgroundColor: COLORS.greenLight }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={COLORS.greenDark} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              <p className="text-sm font-semibold" style={{ color: COLORS.greenDark }}>Documento cargado. Ya lo ve el cliente.</p>
            </div>
          )}
          <div className="space-y-4">
            <Field label="Tipo de documento *">
              <select value={tipo} onChange={e => setTipo(e.target.value)} className="ss-input" style={{ color: COLORS.grayDark, background: '#fff' }}>
                <option value="">Seleccioná el tipo…</option>
                {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha de emisión">
                <input type="date" value={emision} onChange={e => setEmision(e.target.value)} className="ss-input" style={{ color: COLORS.grayDark }} />
              </Field>
              <Field label="Vence el *">
                <input type="date" value={venc} onChange={e => setVenc(e.target.value)} className="ss-input" style={{ color: COLORS.grayDark }} />
              </Field>
            </div>
            <Field label="Archivo (PDF o imagen) *">
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors hover:bg-gray-50" style={{ borderColor: '#D6DAD4' }}>
                <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke={COLORS.grayMid} strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                <span className="text-xs" style={{ color: COLORS.gray }}>Seleccionar archivo</span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
              </label>
            </Field>
            <button onClick={onCargar}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: color }} disabled={!tipo || !venc}>
              Cargar documento
            </button>
          </div>
        </Card>
      </div>

      {/* Lista de docs cargados */}
      <div className="lg:col-span-3">
        <Card title="Documentación cargada" action={<span className="text-xs" style={{ color: COLORS.gray }}>{docs.length} documentos</span>}>
          <div className="space-y-1 max-h-[560px] overflow-y-auto">
            {docs.map(doc => {
              const s = statusStyle(doc.status)
              return (
                <div key={doc.id} className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-gray-50">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.hex }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: COLORS.grayDark }}>{doc.name}</p>
                    <p className="text-xs" style={{ color: COLORS.gray }}>{doc.status === 'expired' ? 'Venció' : 'Vence'} el {fmtDate(doc.expiry)}</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0" style={{ backgroundColor: s.bg, color: s.text }}>{s.label}</span>
                  <button className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 flex-shrink-0" title="Eliminar">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M4 7h16" /></svg>
                  </button>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
