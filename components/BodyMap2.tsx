'use client'

import { COLORS } from '@/lib/theme'
import { PART_LABELS } from '@/lib/mockData'
import { bodyFront } from '@/lib/bodyData/bodyFront'
import { bodyBack } from '@/lib/bodyData/bodyBack'
import type { BodyPart } from '@/lib/bodyData/types'

/**
 * Cuerpo anatómico realista (frente + espalda) — manos, pies, cabeza, izq/der.
 * Datos SVG portados de react-native-body-highlighter (MIT), renderizados en web
 * con nuestro propio componente y los colores de marca.
 */

const NEUTRAL = '#E3E6E2'
function heat(count: number) {
  if (count <= 0) return NEUTRAL
  if (count <= 2) return '#B5DD95'
  if (count <= 4) return COLORS.warn
  return COLORS.danger
}

type Side = 'left' | 'right' | 'both'
type Entry = { slug: string; side: Side }

// Mapeo de nuestras zonas (con izq/der) a las partes de la librería, por vista
const FRONT_MAP: Record<string, Entry[]> = {
  cabeza: [{ slug: 'head', side: 'both' }, { slug: 'hair', side: 'both' }],
  cuello: [{ slug: 'neck', side: 'both' }],
  hombroIzq: [{ slug: 'deltoids', side: 'left' }, { slug: 'trapezius', side: 'left' }],
  hombroDer: [{ slug: 'deltoids', side: 'right' }, { slug: 'trapezius', side: 'right' }],
  brazoIzq: [{ slug: 'biceps', side: 'left' }, { slug: 'triceps', side: 'left' }],
  brazoDer: [{ slug: 'biceps', side: 'right' }, { slug: 'triceps', side: 'right' }],
  antebrazoIzq: [{ slug: 'forearm', side: 'left' }],
  antebrazoDer: [{ slug: 'forearm', side: 'right' }],
  manoIzq: [{ slug: 'hands', side: 'left' }],
  manoDer: [{ slug: 'hands', side: 'right' }],
  pecho: [{ slug: 'chest', side: 'both' }],
  abdomen: [{ slug: 'abs', side: 'both' }, { slug: 'obliques', side: 'both' }],
  piernaIzq: [{ slug: 'quadriceps', side: 'left' }, { slug: 'adductors', side: 'left' }, { slug: 'calves', side: 'left' }, { slug: 'tibialis', side: 'left' }],
  piernaDer: [{ slug: 'quadriceps', side: 'right' }, { slug: 'adductors', side: 'right' }, { slug: 'calves', side: 'right' }, { slug: 'tibialis', side: 'right' }],
  rodillaIzq: [{ slug: 'knees', side: 'left' }],
  rodillaDer: [{ slug: 'knees', side: 'right' }],
  pieIzq: [{ slug: 'feet', side: 'left' }, { slug: 'ankles', side: 'left' }],
  pieDer: [{ slug: 'feet', side: 'right' }, { slug: 'ankles', side: 'right' }],
}
const BACK_MAP: Record<string, Entry[]> = {
  cabeza: [{ slug: 'head', side: 'both' }, { slug: 'hair', side: 'both' }],
  cuello: [{ slug: 'neck', side: 'both' }],
  hombroIzq: [{ slug: 'deltoids', side: 'left' }, { slug: 'trapezius', side: 'left' }],
  hombroDer: [{ slug: 'deltoids', side: 'right' }, { slug: 'trapezius', side: 'right' }],
  brazoIzq: [{ slug: 'triceps', side: 'left' }],
  brazoDer: [{ slug: 'triceps', side: 'right' }],
  antebrazoIzq: [{ slug: 'forearm', side: 'left' }],
  antebrazoDer: [{ slug: 'forearm', side: 'right' }],
  manoIzq: [{ slug: 'hands', side: 'left' }],
  manoDer: [{ slug: 'hands', side: 'right' }],
  gluteoIzq: [{ slug: 'gluteal', side: 'left' }],
  gluteoDer: [{ slug: 'gluteal', side: 'right' }],
  piernaIzq: [{ slug: 'hamstring', side: 'left' }, { slug: 'adductors', side: 'left' }, { slug: 'calves', side: 'left' }],
  piernaDer: [{ slug: 'hamstring', side: 'right' }, { slug: 'adductors', side: 'right' }, { slug: 'calves', side: 'right' }],
  pieIzq: [{ slug: 'feet', side: 'left' }, { slug: 'ankles', side: 'left' }],
  pieDer: [{ slug: 'feet', side: 'right' }, { slug: 'ankles', side: 'right' }],
}

// Intensidad por (slug, lado) según los datos del usuario
function buildIntensity(data: Record<string, number>, map: Record<string, Entry[]>) {
  const m: Record<string, { left: number; right: number; common: number }> = {}
  const set = (slug: string, side: Side, v: number) => {
    m[slug] = m[slug] || { left: 0, right: 0, common: 0 }
    if (side === 'both') { m[slug].left = Math.max(m[slug].left, v); m[slug].right = Math.max(m[slug].right, v); m[slug].common = Math.max(m[slug].common, v) }
    else m[slug][side] = Math.max(m[slug][side], v)
  }
  for (const [key, entries] of Object.entries(map)) {
    const v = data[key] ?? 0
    if (v > 0) for (const e of entries) set(e.slug, e.side, v)
  }
  return m
}

// Reverso: (slug|lado) → zona, para el click
function buildReverse(map: Record<string, Entry[]>) {
  const r: Record<string, string> = {}
  for (const [key, entries] of Object.entries(map)) {
    for (const e of entries) {
      if (e.side === 'both') { r[`${e.slug}|left`] = key; r[`${e.slug}|right`] = key; r[`${e.slug}|common`] = key }
      else r[`${e.slug}|${e.side}`] = key
    }
  }
  return r
}
const REV_FRONT = buildReverse(FRONT_MAP)
const REV_BACK = buildReverse(BACK_MAP)

function BodySvg({
  parts, viewBox, intensity, reverse, data, onSelect,
}: {
  parts: BodyPart[]
  viewBox: string
  intensity: Record<string, { left: number; right: number; common: number }>
  reverse: Record<string, string>
  data: Record<string, number>
  onSelect?: (key: string) => void
}) {
  const elems: React.ReactNode[] = []
  parts.forEach((part, pi) => {
    const slug = part.slug || ''
    const renderSide = (paths: string[] | undefined, side: 'left' | 'right' | 'common') => {
      if (!paths) return
      const count = intensity[slug]?.[side] ?? 0
      const key = reverse[`${slug}|${side}`]
      const label = key ? PART_LABELS[key] : slug
      const realCount = key ? (data[key] ?? 0) : count
      paths.forEach((d, i) => {
        elems.push(
          <path key={`${pi}-${side}-${i}`} d={d} fill={heat(count)} stroke="#FFFFFF" strokeWidth={1.4}
            style={{ cursor: onSelect && key ? 'pointer' : 'default', transition: 'fill .2s' }}
            onClick={onSelect && key ? () => onSelect(key) : undefined}>
            {key && <title>{`${label}: ${realCount} ${realCount === 1 ? 'lesión' : 'lesiones'}`}</title>}
          </path>
        )
      })
    }
    renderSide(part.path?.common, 'common')
    renderSide(part.path?.left, 'left')
    renderSide(part.path?.right, 'right')
  })
  return (
    <svg viewBox={viewBox} className="w-full" style={{ height: 'auto' }} preserveAspectRatio="xMidYMid meet">
      {elems}
    </svg>
  )
}

export default function BodyMap2({
  data, onSelect,
}: {
  data: Record<string, number>
  onSelect?: (key: string) => void
}) {
  const intFront = buildIntensity(data, FRONT_MAP)
  const intBack = buildIntensity(data, BACK_MAP)

  return (
    <div className="w-full">
      <div className="flex items-start justify-center gap-2 sm:gap-4">
        <div className="flex flex-col items-center w-[7rem] sm:w-[8.5rem]">
          <BodySvg parts={bodyFront} viewBox="0 0 724 1448" intensity={intFront} reverse={REV_FRONT} data={data} onSelect={onSelect} />
          <span className="text-xs font-bold tracking-wide mt-1" style={{ color: COLORS.gray }}>FRENTE</span>
        </div>
        <div className="flex flex-col items-center w-[7rem] sm:w-[8.5rem]">
          <BodySvg parts={bodyBack} viewBox="724 0 724 1448" intensity={intBack} reverse={REV_BACK} data={data} onSelect={onSelect} />
          <span className="text-xs font-bold tracking-wide mt-1" style={{ color: COLORS.gray }}>ESPALDA</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
        {[
          { c: NEUTRAL, t: 'Sin lesiones' },
          { c: '#B5DD95', t: 'Pocas' },
          { c: COLORS.warn, t: 'Varias' },
          { c: COLORS.danger, t: 'Muchas' },
        ].map(l => (
          <div key={l.t} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: l.c }} />
            <span className="text-xs" style={{ color: COLORS.gray }}>{l.t}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
