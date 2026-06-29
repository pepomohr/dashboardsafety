'use client'

import { useState } from 'react'
import { COLORS, statusStyle } from '@/lib/theme'
import { DocItem } from '@/lib/mockData'

/**
 * Informe imprimible (Guardar como PDF) con toda la info + firma del Ing. Klopp.
 * Se imprime solo el bloque #informe (ver CSS @media print en globals.css).
 * Firma real: guardá la imagen v8 como  public/firma.png  (si no, va la firma tipográfica).
 */

function FirmaKlopp() {
  const [err, setErr] = useState(false)
  return (
    <div className="flex flex-col items-center">
      {!err ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/firma.png" alt="Firma Ing. Eduardo Klopp" style={{ height: 70, objectFit: 'contain' }} onError={() => setErr(true)} />
      ) : (
        <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 26, color: COLORS.greenDark, lineHeight: 1 }}>E. Klopp</p>
      )}
      <div className="mt-2 pt-2 border-t text-center" style={{ borderColor: COLORS.grayDark, minWidth: 230 }}>
        <p className="text-sm font-bold" style={{ color: COLORS.grayDark }}>Ing. Eduardo Klopp</p>
        <p className="text-xs" style={{ color: COLORS.gray }}>Higiene y Seguridad en el Trabajo</p>
        <p className="text-xs" style={{ color: COLORS.gray }}>Safety Services</p>
      </div>
    </div>
  )
}

export default function InformeReporte({
  empresa, docs, accidentes, indices, porArea,
}: {
  empresa: string
  docs: DocItem[]
  accidentes: number
  indices: { frecuencia: number; gravedad: number; incidencia: number }
  porArea: { area: string; valor: number }[]
}) {
  const total = docs.length
  const vig = docs.filter(d => d.status === 'valid').length
  const exp = docs.filter(d => d.status === 'expiring').length
  const ven = docs.filter(d => d.status === 'expired').length
  const hoy = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div id="informe" className="bg-white text-left" style={{ padding: 36, maxWidth: 800, margin: '0 auto', color: COLORS.grayDark }}>
      {/* Encabezado */}
      <div className="flex items-start justify-between pb-4 mb-5" style={{ borderBottom: `3px solid ${COLORS.green}` }}>
        <div className="flex items-center gap-3">
          <div className="rounded-xl flex items-center justify-center" style={{ width: 52, height: 52, backgroundColor: COLORS.grayDark }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={COLORS.green} strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <div>
            <p className="font-display text-xl font-extrabold leading-none">
              <span style={{ color: COLORS.green }}>Safety</span> <span style={{ color: COLORS.gray }}>Services</span>
            </p>
            <p className="text-xs mt-1" style={{ color: COLORS.gray }}>Higiene y Seguridad en el Trabajo</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs" style={{ color: COLORS.gray }}>Informe emitido el</p>
          <p className="text-sm font-bold">{hoy}</p>
        </div>
      </div>

      <h1 className="font-display text-2xl font-extrabold">Informe de Gestión de Higiene y Seguridad</h1>
      <p className="text-sm mb-6" style={{ color: COLORS.gray }}>Empresa: <b style={{ color: COLORS.grayDark }}>{empresa}</b></p>

      {/* Estado documental */}
      <h2 className="font-display text-base font-bold mb-2" style={{ color: COLORS.greenDark }}>1 · Estado de la documentación</h2>
      <div className="flex gap-3 mb-3">
        {[['Vigentes', vig, COLORS.greenLight, COLORS.greenDark], ['Por vencer', exp, '#FBF3DD', '#8A6A12'], ['Vencidos', ven, '#FBE9E5', '#9A2A18']].map(([l, v, bg, c]) => (
          <div key={l as string} className="flex-1 text-center rounded-lg py-2" style={{ backgroundColor: bg as string }}>
            <p className="text-xl font-bold" style={{ color: c as string }}>{v as number}</p>
            <p className="text-xs font-semibold" style={{ color: c as string }}>{l as string}</p>
          </div>
        ))}
      </div>
      <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: COLORS.bg }}>
            <th className="text-left py-1.5 px-2" style={{ color: COLORS.gray, fontSize: 11 }}>DOCUMENTO</th>
            <th className="text-left py-1.5 px-2" style={{ color: COLORS.gray, fontSize: 11 }}>VENCE</th>
            <th className="text-left py-1.5 px-2" style={{ color: COLORS.gray, fontSize: 11 }}>ESTADO</th>
          </tr>
        </thead>
        <tbody>
          {docs.map(d => {
            const s = statusStyle(d.status)
            return (
              <tr key={d.id} style={{ borderBottom: '1px solid #eee' }}>
                <td className="py-1.5 px-2">{d.name}</td>
                <td className="py-1.5 px-2" style={{ color: COLORS.gray }}>{d.expiry.split('-').reverse().join('/')}</td>
                <td className="py-1.5 px-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.text }}>{s.label}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Siniestralidad */}
      <h2 className="font-display text-base font-bold mt-6 mb-2" style={{ color: COLORS.greenDark }}>2 · Resumen de siniestralidad</h2>
      <div className="grid grid-cols-4 gap-3 mb-3">
        {[['Accidentes', accidentes], ['Frecuencia', indices.frecuencia.toFixed(2)], ['Gravedad', indices.gravedad.toFixed(2)], ['Incidencia', indices.incidencia.toFixed(2)]].map(([l, v]) => (
          <div key={l as string} className="rounded-lg p-3" style={{ border: '1px solid #eee' }}>
            <p className="text-lg font-bold">{v as any}</p>
            <p className="text-xs" style={{ color: COLORS.gray }}>{l as string}</p>
          </div>
        ))}
      </div>
      <p className="text-sm mb-1" style={{ color: COLORS.grayDark }}><b>Accidentes por área:</b></p>
      <p className="text-sm" style={{ color: COLORS.gray }}>
        {porArea.map(a => `${a.area}: ${a.valor}`).join('  ·  ')}
      </p>

      {/* Firma */}
      <div className="flex justify-end mt-12">
        <FirmaKlopp />
      </div>

      <p className="text-center text-xs mt-10" style={{ color: COLORS.grayMid }}>
        Documento generado por Safety Services · {hoy} · Este informe refleja el estado registrado en la plataforma a la fecha de emisión.
      </p>
    </div>
  )
}
