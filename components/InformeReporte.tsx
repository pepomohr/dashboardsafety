'use client'

import { useState } from 'react'
import { COLORS, statusStyle } from '@/lib/theme'
import { DocItem } from '@/lib/mockData'

/**
 * Informe imprimible (Guardar como PDF) con toda la info + firma del Ing. Klopp.
 * Se imprime solo el bloque #informe (ver CSS @media print en globals.css).
 * Firma real: guardá la imagen v8 como  public/firma.png  (si no, va la firma tipográfica).
 */

const FIRMA_SOURCES = ['/firma.jpg', '/firma.png', '/firma.jpeg']
function FirmaKlopp() {
  const [idx, setIdx] = useState(0)
  const failed = idx >= FIRMA_SOURCES.length
  return (
    <div className="flex flex-col items-center">
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={FIRMA_SOURCES[idx]} alt="Firma Ing. Eduardo Klopp" style={{ height: 72, objectFit: 'contain' }} onError={() => setIdx(i => i + 1)} />
      ) : (
        <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 26, color: COLORS.greenDark, lineHeight: 1 }}>E. Klopp</p>
      )}
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
    <div id="informe" className="bg-white text-left p-5 sm:p-9" style={{ maxWidth: 800, width: '100%', margin: '0 auto', color: COLORS.grayDark }}>
      {/* Encabezado */}
      <div className="flex items-start justify-between pb-4 mb-5" style={{ borderBottom: `3px solid ${COLORS.green}` }}>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Safety Services" style={{ width: 60, height: 60, objectFit: 'contain' }} />
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
      {docs.length === 0 ? (
        <p className="text-sm py-3" style={{ color: COLORS.gray }}>No hay documentación cargada a la fecha de emisión.</p>
      ) : (
        <table className="informe-tabla w-full" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col className="col-doc" />
            <col className="col-venc" />
            <col className="col-estado" />
          </colgroup>
          <thead>
            <tr style={{ backgroundColor: COLORS.bg }}>
              <th className="text-left py-1.5 px-2" style={{ color: COLORS.gray, fontSize: 11 }}>DOCUMENTO</th>
              <th className="text-left py-1.5 px-2" style={{ color: COLORS.gray, fontSize: 11 }}>VENCE</th>
              <th className="text-left py-1.5 px-2" style={{ color: COLORS.gray, fontSize: 11 }}>ESTADO</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d, i) => {
              const s = statusStyle(d.status)
              return (
                <tr key={`${d.name}-${i}`} style={{ borderBottom: '1px solid #eee' }}>
                  <td className="celda-doc py-1.5 px-2" style={{ wordBreak: 'break-word' }}>{d.name}</td>
                  <td className="celda-venc py-1.5 px-2" style={{ color: COLORS.gray, whiteSpace: 'nowrap' }}>
                    {d.expiry ? d.expiry.split('-').reverse().join('/') : '—'}
                  </td>
                  <td className="py-1.5 px-2">
                    <span className="chip-estado font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.text, whiteSpace: 'nowrap' }}>{s.label}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* Siniestralidad */}
      <h2 className="font-display text-base font-bold mt-6 mb-2" style={{ color: COLORS.greenDark }}>2 · Resumen de siniestralidad</h2>
      {accidentes === 0 ? (
        <p className="text-sm py-1" style={{ color: COLORS.gray }}>
          Sin accidentes registrados en el período. <b style={{ color: COLORS.greenDark }}>Índice de incidencia: 0,00</b>
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {[['Accidentes', accidentes], ['Índice de incidencia', indices.incidencia.toFixed(2)]].map(([l, v]) => (
              <div key={l as string} className="rounded-lg p-3" style={{ border: '1px solid #eee' }}>
                <p className="text-lg font-bold">{v as any}</p>
                <p className="text-xs" style={{ color: COLORS.gray }}>{l as string}</p>
              </div>
            ))}
          </div>
          <p className="text-sm mb-1" style={{ color: COLORS.grayDark }}><b>Accidentes por área:</b></p>
          <p className="text-sm" style={{ color: COLORS.gray }}>
            {porArea.filter(a => a.valor > 0).map(a => `${a.area}: ${a.valor}`).join('  ·  ') || 'Sin datos por área.'}
          </p>
        </>
      )}

      {/* Firma */}
      <div className="flex justify-end mt-12">
        <FirmaKlopp />
      </div>

      <p className="text-center text-xs mt-10" style={{ color: COLORS.grayMid }}>
        Documento generado por Safety Services · {hoy} · Este informe refleja el estado registrado en la plataforma a la fecha de emisión.
      </p>

      <style jsx>{`
        /* Anchos de la tabla. En pantallas chicas la fecha y el estado necesitan
           más lugar, si no la fecha se corta y se pisa con el chip de vigencia. */
        .informe-tabla { font-size: 14px; }
        .col-doc    { width: 56%; }
        .col-venc   { width: 22%; }
        .col-estado { width: 22%; }
        .chip-estado { font-size: 12px; }

        @media (max-width: 640px) {
          .informe-tabla { font-size: 11px; }
          .col-doc    { width: 44%; }
          .col-venc   { width: 27%; }
          .col-estado { width: 29%; }
          .celda-doc  { line-height: 1.3; }
          .celda-venc { font-size: 10px; }
          .chip-estado { font-size: 9px; padding-left: 6px; padding-right: 6px; }
        }
      `}</style>
    </div>
  )
}
