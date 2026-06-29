import { documents, DocItem, accidentesPorMes, accidentesPorArea, partesCuerpo, indices } from './mockData'

export interface Sucursal {
  id: string
  name: string
  severidad: number
  factor: number
}

export interface Empresa {
  id: string
  name: string
  slug: string
  color: string        // color de marca para la card / logo
  rubro: string
  sede: string
  isClient: boolean    // true = cliente oficial, false = prospecto / demo
  logoUrl?: string     // /empresas/<slug>.png si existe; si no, monograma
  severidad: number    // 0 = impecable, 3 = con varios vencidos (para variar el dashboard)
  factor: number       // escala de accidentes para diferenciar empresas
  sucursales?: Sucursal[]  // si la empresa tiene varias sedes con datos distintos
}

export const empresas: Empresa[] = [
  { id: 'comafi', name: 'Banco Comafi', slug: 'comafi', color: '#E2001A', rubro: 'Banca y servicios financieros', sede: '2 sucursales', isClient: true, logoUrl: '/comafi.png', severidad: 3, factor: 0.7,
    sucursales: [
      { id: 'lomas', name: 'Lomas de Zamora', severidad: 3, factor: 0.9 },
      { id: 'ramos', name: 'Ramos Mejía',     severidad: 1, factor: 0.4 },
    ] },
  { id: 'belgrano', name: 'Club Atlético y Social General Belgrano', slug: 'belgrano', color: '#1E9BD7', rubro: 'Club deportivo', sede: 'General Belgrano, Buenos Aires', isClient: false, logoUrl: '/escudo.png', severidad: 0, factor: 1.0 },
]

// Documentación de la empresa: `severidad` = cantidad de documentos NO vigentes.
// 0 = impecable (28/28). Marca esa cantidad alternando vencido / por vencer.
export function empresaDocs(severidad: number): DocItem[] {
  const issues = [26, 13, 7, 21, 8, 22, 3, 17]  // índices que se marcan como problema, en orden
  return documents.map((d, i) => {
    const pos = issues.indexOf(i)
    if (pos !== -1 && pos < severidad) {
      return { ...d, status: pos % 2 === 0 ? 'expired' as const : 'expiring' as const }
    }
    return { ...d, status: 'valid' as const }
  })
}

export function empresaAccidentesPorMes(factor: number) {
  return accidentesPorMes.map(m => ({
    ...m,
    accidentes: Math.round(m.accidentes * factor),
    incidentes: Math.round(m.incidentes * factor),
  }))
}

export function empresaAccidentesPorArea(factor: number) {
  return accidentesPorArea.map(a => ({ ...a, valor: Math.round(a.valor * factor) }))
}

export function empresaPartes(factor: number): Record<string, number> {
  const out: Record<string, number> = {}
  for (const k in partesCuerpo) out[k] = Math.round(partesCuerpo[k] * factor)
  return out
}

export function empresaIndices(factor: number) {
  return {
    frecuencia: +(indices.frecuencia * factor).toFixed(2),
    gravedad: +(indices.gravedad * factor).toFixed(2),
    incidencia: +(indices.incidencia * factor).toFixed(2),
  }
}
