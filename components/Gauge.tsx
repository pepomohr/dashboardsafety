'use client'

import { COLORS } from '@/lib/theme'

/**
 * Velocímetro tipo tablero de auto.
 * value: 0 (todo en orden, verde) → 1 (crítico, rojo)
 * La aguja se mueve hacia el rojo a medida que hay más documentos venciendo/vencidos.
 */
export default function Gauge({
  value,
  size = 240,
}: {
  value: number
  size?: number
}) {
  const v = Math.max(0, Math.min(1, value))
  const cx = size / 2
  const cy = size * 0.62
  const r = size * 0.42

  // Semicírculo de 180° → -90° (izq) a +90° (der)
  // Empieza en 180° (izquierda) y termina en 0° (derecha)
  const startAngle = 180
  const endAngle = 0

  // Arcos de color: verde (0-0.5), amarillo (0.5-0.75), rojo (0.75-1)
  const segments = [
    { from: 0,    to: 0.5,  color: COLORS.ok },
    { from: 0.5,  to: 0.75, color: COLORS.warn },
    { from: 0.75, to: 1,    color: COLORS.danger },
  ]

  function polar(angleDeg: number, radius: number) {
    const rad = (angleDeg * Math.PI) / 180
    return { x: cx + radius * Math.cos(rad), y: cy - radius * Math.sin(rad) }
  }

  function arcPath(from: number, to: number, radius: number, width: number) {
    const a0 = startAngle + (endAngle - startAngle) * from
    const a1 = startAngle + (endAngle - startAngle) * to
    const outer0 = polar(a0, radius)
    const outer1 = polar(a1, radius)
    const inner1 = polar(a1, radius - width)
    const inner0 = polar(a0, radius - width)
    const large = Math.abs(a1 - a0) > 180 ? 1 : 0
    // sweep: ángulos decrecen → sweep 1
    return [
      `M ${outer0.x} ${outer0.y}`,
      `A ${radius} ${radius} 0 ${large} 1 ${outer1.x} ${outer1.y}`,
      `L ${inner1.x} ${inner1.y}`,
      `A ${radius - width} ${radius - width} 0 ${large} 0 ${inner0.x} ${inner0.y}`,
      'Z',
    ].join(' ')
  }

  // Aguja
  const needleAngle = startAngle + (endAngle - startAngle) * v
  const needleTip = polar(needleAngle, r - 6)
  const needleBaseL = polar(needleAngle + 90, size * 0.022)
  const needleBaseR = polar(needleAngle - 90, size * 0.022)

  const width = size * 0.13

  return (
    <svg width={size} height={size * 0.72} viewBox={`0 0 ${size} ${size * 0.72}`}>
      {/* Arcos */}
      {segments.map((s, i) => (
        <path key={i} d={arcPath(s.from, s.to, r, width)} fill={s.color} opacity={0.92} />
      ))}

      {/* Marcas (ticks) */}
      {Array.from({ length: 11 }).map((_, i) => {
        const t = i / 10
        const a = startAngle + (endAngle - startAngle) * t
        const p1 = polar(a, r + 2)
        const p2 = polar(a, r - width - 4)
        return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="white" strokeWidth={i % 5 === 0 ? 2.5 : 1} opacity={0.7} />
      })}

      {/* Aguja */}
      <polygon
        points={`${needleTip.x},${needleTip.y} ${needleBaseL.x},${needleBaseL.y} ${needleBaseR.x},${needleBaseR.y}`}
        fill={COLORS.grayDark}
      />
      <circle cx={cx} cy={cy} r={size * 0.05} fill={COLORS.grayDark} />
      <circle cx={cx} cy={cy} r={size * 0.025} fill="white" />

      {/* Etiquetas extremos */}
      <text x={polar(180, r).x - 4} y={cy + 16} fontSize={size * 0.05} fill={COLORS.ok} fontWeight="700" textAnchor="middle">OK</text>
      <text x={polar(0, r).x + 2} y={cy + 16} fontSize={size * 0.05} fill={COLORS.danger} fontWeight="700" textAnchor="middle">!</text>
    </svg>
  )
}
