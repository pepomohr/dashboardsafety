'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { COLORS } from '@/lib/theme'
import { PART_LABELS } from '@/lib/mockData'
import BodyMap2 from './BodyMap2'
import Card from './Card'

const TURNOS = ['Mañana', 'Tarde', 'Noche']
const AREAS = ['Área 1', 'Área 2', 'Área 3', 'Área 4', 'Área 5', 'Área 6', 'Área 7']
const LESIONES = ['Corte', 'Fractura', 'Esguince', 'Quemadura', 'Traumatismo', 'Golpe / contusión', 'Lesión lumbar', 'Otro']
const INVEST = ['No realizada', 'En proceso', 'Concluida']
const GRAVEDADES = ['Leve', 'Moderada', 'Grave']

// Orden de las zonas para la lista de +/-
const ZONAS = Object.keys(PART_LABELS)

export interface Accidente {
  id: number
  fecha: string
  hora: string
  turno: string
  area: string
  parteKey: string
  parteLabel?: string
  cantidad?: number
  gravedad: string
  lesion: string
  detalle: string
  investigacion: string
  descripcion: string
}

function fmtDate(d: string) {
  if (!d) return '—'
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) { const [y, m, day] = d.slice(0, 10).split('-'); return `${day}/${m}/${y}` }
  return d
}
function rowVal(r: Record<string, any>, ...names: string[]) {
  for (const n of names) for (const k in r) if (k.toLowerCase().trim() === n) return String(r[k] ?? '').trim()
  return ''
}
function normFecha(s: string) {
  if (!s) return ''
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
  if (m) { const yy = m[3].length === 2 ? '20' + m[3] : m[3]; return `${yy}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` }
  return s
}
function matchParte(t: string) {
  if (!t) return ''
  const s = t.toLowerCase().trim()
  for (const [k, l] of Object.entries(PART_LABELS)) {
    const root = l.toLowerCase().replace(/ (izq|der)\.?$/, '')
    if (l.toLowerCase() === s || s === root || s.includes(root)) return k
  }
  return ''
}
function invStyle(v: string) {
  if (v === 'Concluida') return { bg: COLORS.greenLight, text: COLORS.greenDark }
  if (v === 'En proceso') return { bg: '#FBF3DD', text: '#8A6A12' }
  return { bg: '#FBE9E5', text: '#9A2A18' }
}
function gravStyle(v: string) {
  if (v === 'Leve') return { bg: COLORS.greenLight, text: COLORS.greenDark, hex: COLORS.green }
  if (v === 'Moderada') return { bg: '#FBF3DD', text: '#8A6A12', hex: COLORS.warn }
  return { bg: '#FBE9E5', text: '#9A2A18', hex: COLORS.danger }
}

export default function CargaAccidentes({ color }: { color: string }) {
  const [modo, setModo] = useState<'form' | 'mapa'>('mapa')
  const [list, setList] = useState<Accidente[]>([])
  const [ok, setOk] = useState(false)
  const [importMsg, setImportMsg] = useState<{ text: string; tone: 'ok' | 'warn' } | null>(null)

  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [turno, setTurno] = useState('')
  const [area, setArea] = useState('')
  const [parteKey, setParteKey] = useState('')
  const [parteSearch, setParteSearch] = useState('')
  const [parteOpen, setParteOpen] = useState(false)
  const [lesion, setLesion] = useState('')
  const [detalle, setDetalle] = useState('')
  const [investigacion, setInvestigacion] = useState('No realizada')
  const [descripcion, setDescripcion] = useState('')
  const [gravedad, setGravedad] = useState('Moderada')

  // Modo mapa: conteo por zona que se va sumando con +/-
  const [tally, setTally] = useState<Record<string, number>>({})
  const tallyTotal = Object.values(tally).reduce((s, v) => s + v, 0)

  const opciones = Object.entries(PART_LABELS).filter(([, label]) => label.toLowerCase().includes(parteSearch.toLowerCase()))

  function pickParte(key: string) { setParteKey(key); setParteSearch(PART_LABELS[key]); setParteOpen(false) }
  function bump(key: string, delta: number) {
    setTally(t => {
      const v = Math.max(0, (t[key] ?? 0) + delta)
      const next = { ...t }
      if (v === 0) delete next[key]; else next[key] = v
      return next
    })
  }

  function resetCampos() {
    setFecha(''); setHora(''); setTurno(''); setArea(''); setParteKey(''); setParteSearch('')
    setLesion(''); setDetalle(''); setInvestigacion('No realizada'); setDescripcion(''); setGravedad('Moderada'); setTally({})
  }

  function guardar() {
    const base = { fecha, hora, turno, area, gravedad, lesion: lesion || '—', detalle: lesion === 'Otro' ? detalle : '', investigacion, descripcion }
    if (modo === 'form') {
      if (!fecha || !parteKey || !lesion) return
      setList(l => [{ id: Date.now(), parteKey, ...base }, ...l])
    } else {
      if (!fecha || tallyTotal === 0) return
      const nuevos: Accidente[] = Object.entries(tally).map(([key, n], i) => ({
        id: Date.now() + i, parteKey: key, cantidad: n, ...base,
      }))
      setList(l => [...nuevos, ...l])
    }
    setOk(true); resetCampos(); setTimeout(() => setOk(false), 2500)
  }

  function importExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'array' })
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets[wb.SheetNames[0]], { raw: false, defval: '' })
        if (!rows.length) { setImportMsg({ text: 'El archivo no tiene filas.', tone: 'warn' }); return }
        const mapped: Accidente[] = []
        for (const r of rows) {
          const fechaR = normFecha(rowVal(r, 'fecha', 'dia', 'día'))
          const parteText = rowVal(r, 'parte', 'parte del cuerpo', 'zona', 'region', 'región')
          const lesionR = rowVal(r, 'lesion', 'lesión', 'tipo de lesion', 'tipo de lesión', 'tipo', 'diagnostico', 'diagnóstico')
          if (!fechaR && !parteText && !lesionR) continue
          const key = matchParte(parteText)
          mapped.push({
            id: Date.now() + Math.random(), fecha: fechaR, hora: rowVal(r, 'hora'), turno: rowVal(r, 'turno'),
            area: rowVal(r, 'area', 'área'), parteKey: key, parteLabel: key ? PART_LABELS[key] : parteText,
            gravedad: rowVal(r, 'gravedad', 'severidad') || 'Moderada', lesion: lesionR || '—', detalle: '',
            investigacion: rowVal(r, 'investigacion', 'investigación', 'estado') || 'No realizada',
            descripcion: rowVal(r, 'descripcion', 'descripción', 'observaciones', 'observacion'),
          })
        }
        if (!mapped.length) { setImportMsg({ text: `No reconocimos columnas de accidentes. Columnas del archivo: ${Object.keys(rows[0]).join(', ')}`, tone: 'warn' }); return }
        setList(l => [...mapped, ...l])
        setImportMsg({ text: `Importados ${mapped.length} accidentes desde "${file.name}".`, tone: 'ok' })
      } catch { setImportMsg({ text: 'No se pudo leer el archivo. ¿Es un Excel (.xlsx) o CSV válido?', tone: 'warn' }) }
    }
    reader.readAsArrayBuffer(file); e.target.value = ''
  }

  const canSave = modo === 'form' ? (fecha && parteKey && lesion) : (fecha && tallyTotal > 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
      <div className="lg:col-span-3">
        <Card>
          {/* Switch + importar */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h3 className="font-display text-sm font-bold uppercase tracking-wide" style={{ color: COLORS.grayDark }}>Registrar accidente</h3>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border hover:bg-gray-50" style={{ borderColor: '#e5e7eb', color: COLORS.grayDark }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={COLORS.greenDark} strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Importar Excel
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={importExcel} />
              </label>
              <div className="inline-flex rounded-xl p-1" style={{ backgroundColor: COLORS.bg }}>
                {([['mapa', 'Mapa corporal'], ['form', 'Formulario']] as const).map(([m, lbl]) => (
                  <button key={m} onClick={() => setModo(m)} className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    style={modo === m ? { backgroundColor: '#fff', color: COLORS.grayDark, boxShadow: '0 1px 3px rgba(0,0,0,.1)' } : { color: COLORS.gray }}>{lbl}</button>
                ))}
              </div>
            </div>
          </div>

          {importMsg && (
            <div className="mb-4 rounded-xl px-4 py-3 flex items-start gap-2" style={{ backgroundColor: importMsg.tone === 'ok' ? COLORS.greenLight : '#FBF3DD' }}>
              <span>{importMsg.tone === 'ok' ? '✅' : 'ℹ️'}</span>
              <p className="text-sm font-medium flex-1" style={{ color: importMsg.tone === 'ok' ? COLORS.greenDark : '#8A6A12' }}>{importMsg.text}</p>
              <button onClick={() => setImportMsg(null)} className="text-xs" style={{ color: COLORS.gray }}>✕</button>
            </div>
          )}
          {ok && (
            <div className="mb-4 rounded-xl px-4 py-3 flex items-center gap-2" style={{ backgroundColor: COLORS.greenLight }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={COLORS.greenDark} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              <p className="text-sm font-semibold" style={{ color: COLORS.greenDark }}>Accidente registrado.</p>
            </div>
          )}

          {/* ───── MODO MAPA: cuerpo + steppers ───── */}
          {modo === 'mapa' && (
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="sm:w-1/2 rounded-xl p-2" style={{ backgroundColor: COLORS.bg }}>
                <BodyMap2 data={tally} onSelect={(k) => bump(k, 1)} />
                <p className="text-center text-xs mt-1" style={{ color: COLORS.gray }}>Tocá una zona o usá los +/- ({tallyTotal} {tallyTotal === 1 ? 'lesión' : 'lesiones'})</p>
              </div>
              <div className="sm:w-1/2">
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: COLORS.gray }}>Zonas afectadas</p>
                <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                  {ZONAS.map(key => {
                    const n = tally[key] ?? 0
                    return (
                      <div key={key} className="flex items-center justify-between gap-2 py-0.5">
                        <span className="text-sm truncate" style={{ color: n > 0 ? COLORS.grayDark : COLORS.gray, fontWeight: n > 0 ? 600 : 400 }}>{PART_LABELS[key]}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button onClick={() => bump(key, -1)} disabled={n === 0}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-sm font-bold border disabled:opacity-30"
                            style={{ borderColor: '#e5e7eb', color: COLORS.grayDark }}>−</button>
                          <span className="w-5 text-center text-sm font-bold" style={{ color: n > 0 ? color : COLORS.grayMid }}>{n}</span>
                          <button onClick={() => bump(key, 1)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                            style={{ backgroundColor: color }}>+</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ───── Campos comunes ───── */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha *"><input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="ss-input2" style={{ color: COLORS.grayDark }} /></Field>
              <Field label="Hora"><input type="time" value={hora} onChange={e => setHora(e.target.value)} className="ss-input2" style={{ color: COLORS.grayDark }} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Turno"><select value={turno} onChange={e => setTurno(e.target.value)} className="ss-input2" style={{ color: COLORS.grayDark }}><option value="">—</option>{TURNOS.map(t => <option key={t}>{t}</option>)}</select></Field>
              <Field label="Área de trabajo"><select value={area} onChange={e => setArea(e.target.value)} className="ss-input2" style={{ color: COLORS.grayDark }}><option value="">—</option>{AREAS.map(a => <option key={a}>{a}</option>)}</select></Field>
            </div>

            {/* Parte (solo formulario) */}
            {modo === 'form' && (
              <Field label="Parte del cuerpo *">
                <div className="relative">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={COLORS.grayMid} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input value={parteSearch} placeholder="Buscar o elegir zona…" onChange={e => { setParteSearch(e.target.value); setParteOpen(true); setParteKey('') }} onFocus={() => setParteOpen(true)} onBlur={() => setTimeout(() => setParteOpen(false), 150)} className="ss-input2" style={{ color: COLORS.grayDark, paddingLeft: '2.1rem' }} />
                  </div>
                  {parteOpen && opciones.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-100 max-h-52 overflow-y-auto">
                      {opciones.map(([key, label]) => <button key={key} type="button" onMouseDown={() => pickParte(key)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50" style={{ color: COLORS.grayDark }}>{label}</button>)}
                    </div>
                  )}
                </div>
              </Field>
            )}

            {/* Gravedad */}
            <Field label="Gravedad del accidente *">
              <div className="flex gap-2">
                {GRAVEDADES.map(g => {
                  const s = gravStyle(g); const sel = gravedad === g
                  return (
                    <button key={g} type="button" onClick={() => setGravedad(g)}
                      className="flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all flex items-center justify-center gap-1.5"
                      style={sel ? { backgroundColor: s.bg, color: s.text, borderColor: s.hex } : { backgroundColor: '#fff', color: COLORS.gray, borderColor: '#e5e7eb' }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.hex }} />{g}
                    </button>
                  )
                })}
              </div>
            </Field>

            {/* Tipo de lesión */}
            <Field label="Tipo de lesión *">
              <div className="flex flex-wrap gap-2">
                {LESIONES.map(l => (
                  <button key={l} type="button" onClick={() => setLesion(l)} className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
                    style={lesion === l ? { backgroundColor: color, color: '#fff', borderColor: color } : { backgroundColor: '#fff', color: COLORS.grayDark, borderColor: '#e5e7eb' }}>{l}</button>
                ))}
              </div>
            </Field>
            {lesion === 'Otro' && <Field label="Detalle de la lesión"><input value={detalle} onChange={e => setDetalle(e.target.value)} placeholder="Describí la lesión" className="ss-input2" style={{ color: COLORS.grayDark }} /></Field>}

            <Field label="Estado de la investigación">
              <div className="flex flex-wrap gap-2">
                {INVEST.map(v => { const s = invStyle(v); const sel = investigacion === v; return (
                  <button key={v} type="button" onClick={() => setInvestigacion(v)} className="px-3 py-1.5 rounded-full text-xs font-semibold border"
                    style={sel ? { backgroundColor: s.bg, color: s.text, borderColor: s.text } : { backgroundColor: '#fff', color: COLORS.gray, borderColor: '#e5e7eb' }}>{v}</button>
                )})}
              </div>
            </Field>

            <Field label="Descripción / observaciones"><textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2} placeholder="¿Cómo ocurrió?" className="ss-input2 resize-none" style={{ color: COLORS.grayDark }} /></Field>

            <button onClick={guardar} disabled={!canSave} className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50" style={{ backgroundColor: color }}>
              {modo === 'mapa' && tallyTotal > 0 ? `Registrar ${tallyTotal} ${tallyTotal === 1 ? 'lesión' : 'lesiones'}` : 'Registrar accidente'}
            </button>
          </div>
        </Card>
      </div>

      {/* Lista */}
      <div className="lg:col-span-2">
        <Card title="Accidentes registrados" action={<span className="text-xs" style={{ color: COLORS.gray }}>{list.length}</span>}>
          {list.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2 text-center">
              <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke={COLORS.grayLight} strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <p className="text-sm" style={{ color: COLORS.gray }}>Todavía no cargaste accidentes</p>
              <p className="text-xs" style={{ color: COLORS.grayMid }}>Sumá zonas con +/- o tocá el cuerpo</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[560px] overflow-y-auto">
              {list.map(a => {
                const s = invStyle(a.investigacion); const g = gravStyle(a.gravedad)
                return (
                  <div key={a.id} className="rounded-xl border border-gray-100 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold" style={{ color: COLORS.grayDark }}>
                        {(a.parteKey ? PART_LABELS[a.parteKey] : a.parteLabel) || '—'}{a.cantidad && a.cantidad > 1 ? ` ×${a.cantidad}` : ''} · {a.lesion === 'Otro' ? a.detalle || 'Otro' : a.lesion}
                      </p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: g.bg, color: g.text }}>{a.gravedad}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-xs" style={{ color: COLORS.gray }}>{fmtDate(a.fecha)}{a.hora && ` · ${a.hora}`}{a.turno && ` · ${a.turno}`}{a.area && ` · ${a.area}`}</p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.bg, color: s.text }}>{a.investigacion}</span>
                    </div>
                    {a.descripcion && <p className="text-xs mt-1 italic" style={{ color: COLORS.grayMid }}>“{a.descripcion}”</p>}
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      <style jsx global>{`
        .ss-input2 { width: 100%; padding: 0.6rem 0.85rem; border-radius: 0.6rem; border: 1px solid #e5e7eb; font-size: 0.875rem; outline: none; background: #fff; }
        .ss-input2:focus { box-shadow: 0 0 0 2px ${COLORS.green}55; border-color: ${COLORS.green}; }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-semibold mb-1" style={{ color: COLORS.gray }}>{label}</label>{children}</div>
}
