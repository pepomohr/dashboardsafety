/**
 * Cálculo de todos los datos del dashboard a partir de los accidentes REALES
 * (los que el admin cargó en la base). Nada inventado: si no hay accidentes,
 * todo da 0/vacío y la UI muestra los estados "sin datos".
 */
import { AccRow } from './supabase'
import { MESES, PART_LABELS } from './mockData'

export interface Aggregados {
  total: number
  porMes: { mes: string; accidentes: number }[]
  porArea: { area: string; valor: number }[]
  porTurno: { turno: string; valor: number }[]     // valor = %
  porLesion: { tipo: string; valor: number }[]
  gravedad: { label: string; value: number }[]
  investigacion: { label: string; value: number }[]
  partes: Record<string, number>
  sinInvestigar: number
  incidencia: number | null                          // requiere nº de trabajadores
}

const cant = (a: AccRow) => (a.cantidad && a.cantidad > 0 ? a.cantidad : 1)

/** Agrupa por un campo y suma la cantidad; devuelve pares [clave, total]. */
function contar(accs: AccRow[], campo: (a: AccRow) => string | null | undefined) {
  const m = new Map<string, number>()
  for (const a of accs) {
    const k = (campo(a) || '').trim()
    if (!k) continue
    m.set(k, (m.get(k) || 0) + cant(a))
  }
  return m
}

export function agregarAccidentes(accs: AccRow[], anio?: string | null, trabajadores?: number | null): Aggregados {
  const acc = anio ? accs.filter(a => (a.fecha || '').slice(0, 4) === anio) : accs
  const total = acc.reduce((s, a) => s + cant(a), 0)

  // Por mes (según el mes de la fecha)
  const mesCount = new Array(12).fill(0)
  for (const a of acc) {
    const m = a.fecha ? Number(a.fecha.slice(5, 7)) - 1 : -1
    if (m >= 0 && m < 12) mesCount[m] += cant(a)
  }
  const porMes = MESES.map((mes, i) => ({ mes, accidentes: mesCount[i] }))

  // Por área
  const areaMap = contar(acc, a => a.area)
  const porArea = Array.from(areaMap, ([area, valor]) => ({ area, valor })).sort((a, b) => b.valor - a.valor)

  // Por turno (en %)
  const turnoMap = contar(acc, a => a.turno)
  const turnoTotal = Array.from(turnoMap.values()).reduce((s, v) => s + v, 0) || 1
  const porTurno = Array.from(turnoMap, ([turno, v]) => ({ turno, valor: Math.round((v / turnoTotal) * 100) }))

  // Por tipo de lesión
  const lesionMap = contar(acc, a => a.lesion)
  const porLesion = Array.from(lesionMap, ([tipo, valor]) => ({ tipo, valor })).sort((a, b) => b.valor - a.valor)

  // Gravedad (para torta) — orden fijo
  const gravMap = contar(acc, a => a.gravedad)
  const gravedad = ['Leve', 'Moderada', 'Grave'].map(label => ({ label, value: gravMap.get(label) || 0 })).filter(g => g.value > 0)

  // Investigación (para torta)
  const invMap = contar(acc, a => a.investigacion)
  const investigacion = ['Concluida', 'En proceso', 'No realizada'].map(label => ({ label, value: invMap.get(label) || 0 })).filter(g => g.value > 0)
  const sinInvestigar = invMap.get('No realizada') || 0

  // Partes del cuerpo (para el mapa) — clave = key de PART_LABELS
  const partes: Record<string, number> = {}
  for (const a of acc) {
    const k = a.parte_cuerpo
    if (k && PART_LABELS[k]) partes[k] = (partes[k] || 0) + cant(a)
  }

  // Índice de incidencia = accidentes / trabajadores × 100 (solo si hay dotación)
  const incidencia = trabajadores && trabajadores > 0 ? +((total / trabajadores) * 100).toFixed(2) : null

  return { total, porMes, porArea, porTurno, porLesion, gravedad, investigacion, partes, sinInvestigar, incidencia }
}
