// Paleta Safety Services — tomada del logo (verde, gris, blanco)
export const COLORS = {
  green:       '#6FB63F', // verde del checkmark
  greenDark:   '#4E8B2C',
  greenLight:  '#E7F3DD',
  grayDark:    '#3D3D3D', // gris de la cabeza del logo
  gray:        '#7A7A7A',
  grayMid:     '#A8A8A8',
  grayLight:   '#E6E7E6',
  bg:          '#F4F5F3',
  white:       '#FFFFFF',
  // Semáforo
  ok:          '#6FB63F',
  warn:        '#E8B53A',
  danger:      '#D9472B',
} as const

// Estados de documentos / accidentes
export function statusStyle(status: 'valid' | 'expiring' | 'expired') {
  if (status === 'expired')  return { hex: COLORS.danger, bg: '#FBE9E5', text: '#9A2A18', label: 'Vencido' }
  if (status === 'expiring') return { hex: COLORS.warn,   bg: '#FBF3DD', text: '#8A6A12', label: 'Por vencer' }
  return                            { hex: COLORS.ok,     bg: COLORS.greenLight, text: COLORS.greenDark, label: 'Vigente' }
}
