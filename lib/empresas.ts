import { documents, DocItem, accidentesPorMes, accidentesPorArea, partesCuerpo, indices } from './mockData'

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
}

export const empresas: Empresa[] = [
  { id: 'comafi',   name: 'Banco Comafi',        slug: 'comafi',   color: '#E2001A', rubro: 'Banca y servicios financieros', sede: 'CABA · Microcentro', isClient: true,  severidad: 1, factor: 0.7 },
  { id: 'belgrano', name: 'Club Atlético Belgrano', slug: 'belgrano', color: '#1E9BD7', rubro: 'Club deportivo', sede: 'Córdoba Capital', isClient: false, severidad: 2, factor: 1.0 },
  { id: 'fenix',    name: 'Metalúrgica Fénix',   slug: 'fenix',    color: '#F57C00', rubro: 'Industria metalúrgica', sede: 'Banfield · Lomas de Zamora', isClient: true, severidad: 3, factor: 1.4 },
  { id: 'logisur',  name: 'Logística del Sur',   slug: 'logisur',  color: '#2E7D32', rubro: 'Transporte y logística', sede: 'Avellaneda', isClient: true, severidad: 0, factor: 0.9 },
]

// Documentación de la empresa: parte del set maestro y le ajusta el estado según la severidad
export function empresaDocs(severidad: number): DocItem[] {
  return documents.map((d, i) => {
    let status = d.status
    if (severidad >= 1 && i === 26) status = 'expired'
    else if (severidad >= 2 && i === 13) status = 'expired'
    else if (severidad >= 3 && (i === 7 || i === 21)) status = 'expiring'
    else if (severidad === 0) status = 'valid'   // impecable
    return { ...d, status }
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
