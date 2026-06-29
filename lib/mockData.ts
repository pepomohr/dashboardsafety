// Datos de prueba basados en el Excel real del cliente (Safety Services)

export type DocStatus = 'valid' | 'expiring' | 'expired'

export interface DocItem {
  id: number
  name: string
  status: DocStatus
  expiry: string          // ISO date
  desvio: 'sin' | 'con' | 'na'  // sin desvíos / con desvíos / no aplica
  note?: string
  pdfOnly?: boolean
  pct?: number            // para capacitaciones con % de personal
}

// Los 28 tipos de documentos del borrador
export const documents: DocItem[] = [
  { id: 1,  name: 'RGRL — Relevamiento General de Riesgos Laborales', status: 'valid',    expiry: '2026-11-20', desvio: 'sin' },
  { id: 2,  name: 'RAR — Relevamiento de Agentes de Riesgo',          status: 'valid',    expiry: '2026-10-05', desvio: 'sin' },
  { id: 3,  name: 'Capacitación del personal — Riesgos generales',     status: 'valid',    expiry: '2026-12-01', desvio: 'sin', pct: 85 },
  { id: 4,  name: 'Capacitación del personal — Riesgos específicos',   status: 'expiring', expiry: '2026-07-12', desvio: 'con', note: 'Falta capacitar al sector de mantenimiento', pct: 60 },
  { id: 5,  name: 'Plan anual de capacitación',                       status: 'valid',    expiry: '2026-12-31', desvio: 'sin', pdfOnly: true },
  { id: 6,  name: 'Análisis de riesgo por puesto de trabajo',          status: 'valid',    expiry: '2026-09-15', desvio: 'sin' },
  { id: 7,  name: 'Norma de trabajo seguro',                          status: 'valid',    expiry: '2026-10-30', desvio: 'sin' },
  { id: 8,  name: 'Investigación de accidentes',                      status: 'expiring', expiry: '2026-07-05', desvio: 'con', note: '5 accidentes pendientes de investigar' },
  { id: 9,  name: 'Medición de ruido',                                status: 'valid',    expiry: '2026-08-22', desvio: 'sin' },
  { id: 10, name: 'Medición de iluminación',                          status: 'valid',    expiry: '2026-08-22', desvio: 'sin' },
  { id: 11, name: 'Medición de carga térmica',                        status: 'valid',    expiry: '2026-09-01', desvio: 'na' },
  { id: 12, name: 'Medición de contaminantes',                        status: 'valid',    expiry: '2026-10-10', desvio: 'sin' },
  { id: 13, name: 'Evaluación de riesgo ergonómico',                  status: 'valid',    expiry: '2026-11-11', desvio: 'sin' },
  { id: 14, name: 'Medición de puesta a tierra',                      status: 'expired',  expiry: '2026-05-30', desvio: 'con', note: 'Vencida — reprogramar medición con matriculado' },
  { id: 15, name: 'Análisis de agua / Limpieza de tanque',            status: 'valid',    expiry: '2026-09-18', desvio: 'sin' },
  { id: 16, name: 'Medición de vibraciones',                          status: 'valid',    expiry: '2026-10-25', desvio: 'na' },
  { id: 17, name: 'Plan de evacuación',                               status: 'valid',    expiry: '2026-12-05', desvio: 'sin' },
  { id: 18, name: 'Estudio de riesgo de incendio',                    status: 'valid',    expiry: '2026-11-02', desvio: 'sin' },
  { id: 19, name: 'Estudio de medios de salida',                      status: 'valid',    expiry: '2026-11-02', desvio: 'sin' },
  { id: 20, name: 'Verificación de instalación de incendios',         status: 'valid',    expiry: '2026-08-15', desvio: 'sin' },
  { id: 21, name: 'Verificación de detección de incendios',           status: 'valid',    expiry: '2026-08-15', desvio: 'sin' },
  { id: 22, name: 'Verificación de extintores',                       status: 'expiring', expiry: '2026-07-20', desvio: 'sin', note: 'Recarga programada' },
  { id: 23, name: 'Aparatos sometidos a presión',                     status: 'valid',    expiry: '2026-09-28', desvio: 'sin' },
  { id: 24, name: 'Ascensores y montacargas',                         status: 'valid',    expiry: '2026-10-12', desvio: 'sin' },
  { id: 25, name: 'Verificación edilicia',                            status: 'valid',    expiry: '2026-11-30', desvio: 'sin' },
  { id: 26, name: 'Póliza de ART',                                    status: 'valid',    expiry: '2026-12-15', desvio: 'sin' },
  { id: 27, name: 'Seguro de vida obligatorio',                       status: 'expired',  expiry: '2026-06-01', desvio: 'con', note: 'Renovar póliza con la aseguradora' },
  { id: 28, name: 'Habilitación del establecimiento',                 status: 'valid',    expiry: '2027-01-10', desvio: 'sin', pdfOnly: true },
]

export const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

// Accidentes por mes (del Excel)
export const accidentesPorMes = [
  { mes: 'Ene', accidentes: 2, incidentes: 8 },
  { mes: 'Feb', accidentes: 3, incidentes: 4 },
  { mes: 'Mar', accidentes: 0, incidentes: 4 },
  { mes: 'Abr', accidentes: 0, incidentes: 5 },
  { mes: 'May', accidentes: 0, incidentes: 3 },
  { mes: 'Jun', accidentes: 1, incidentes: 3 },
  { mes: 'Jul', accidentes: 1, incidentes: 4 },
  { mes: 'Ago', accidentes: 0, incidentes: 3 },
  { mes: 'Sep', accidentes: 1, incidentes: 4 },
  { mes: 'Oct', accidentes: 2, incidentes: 3 },
  { mes: 'Nov', accidentes: 0, incidentes: 4 },
  { mes: 'Dic', accidentes: 2, incidentes: 3 },
]

// Accidentes por área (del Dashboard 02)
export const accidentesPorArea = [
  { area: 'Área 1', valor: 8 },
  { area: 'Área 2', valor: 10 },
  { area: 'Área 3', valor: 5 },
  { area: 'Área 4', valor: 12 },
  { area: 'Área 5', valor: 8 },
  { area: 'Área 6', valor: 2 },
  { area: 'Área 7', valor: 2 },
]

// Accidentes por turno
export const accidentesPorTurno = [
  { turno: 'Mañana', valor: 28 },
  { turno: 'Tarde',  valor: 45 },
  { turno: 'Noche',  valor: 27 },
]

// Investigación de accidentes
export const investigacion = [
  { estado: 'Concluida',    valor: 61 },
  { estado: 'En proceso',   valor: 30 },
  { estado: 'No realizada', valor: 9 },
]

// Cantidad de accidentes SIN investigar (para alerta del admin)
export const accidentesSinInvestigar = 5

// Diagnósticos / tipo de lesión
export const diagnosticos = [
  { tipo: 'Traumatismos', valor: 7 },
  { tipo: 'Cortes',       valor: 5 },
  { tipo: 'Esguinces',    valor: 4 },
  { tipo: 'Fracturas',    valor: 2 },
  { tipo: 'Quemaduras',   valor: 2 },
  { tipo: 'Lesión lumbar',valor: 3 },
]

// Circunstancia del accidente
export const circunstancia = [
  { tipo: 'En el trabajo',          valor: 14 },
  { tipo: 'In itinere',             valor: 6 },
  { tipo: 'Fuera del establecimiento', valor: 3 },
]

// Índices de accidentabilidad (del dashboard real)
export const indices = {
  frecuencia: 0.18,
  gravedad:   0.23,
  incidencia: 0.23,
  accidentesAcumulados: 12,
}

// Etiquetas legibles de cada zona del cuerpo
export const PART_LABELS: Record<string, string> = {
  cabeza: 'Cabeza', cuello: 'Cuello',
  hombroIzq: 'Hombro izq.', hombroDer: 'Hombro der.',
  brazoIzq: 'Brazo izq.', brazoDer: 'Brazo der.',
  antebrazoIzq: 'Antebrazo izq.', antebrazoDer: 'Antebrazo der.',
  manoIzq: 'Mano izq.', manoDer: 'Mano der.',
  pecho: 'Pecho', abdomen: 'Abdomen',
  gluteoIzq: 'Glúteo izq.', gluteoDer: 'Glúteo der.',
  piernaIzq: 'Pierna izq.', piernaDer: 'Pierna der.',
  rodillaIzq: 'Rodilla izq.', rodillaDer: 'Rodilla der.',
  pieIzq: 'Pie izq.', pieDer: 'Pie der.',
}

// Partes del cuerpo afectadas — para el mapa corporal (cantidad de lesiones)
export const partesCuerpo: Record<string, number> = {
  cabeza: 5,
  cuello: 3,
  hombroIzq: 1,
  hombroDer: 4,
  brazoIzq: 5,
  brazoDer: 1,
  antebrazoIzq: 1,
  antebrazoDer: 3,
  manoIzq: 1,
  manoDer: 1,
  pecho: 1,
  abdomen: 1,
  gluteoIzq: 2,
  gluteoDer: 1,
  piernaIzq: 5,
  piernaDer: 1,
  rodillaIzq: 5,
  rodillaDer: 0,
  pieIzq: 1,
  pieDer: 1,
}
