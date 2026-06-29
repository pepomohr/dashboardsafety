'use client'

import { useState } from 'react'

/**
 * Logo de la empresa cliente.
 * Si existe /public/empresas/<slug>.png lo muestra; si no, dibuja un monograma
 * con el color de marca. Para usar el logo real: guardá la imagen en
 * public/empresas/<slug>.png
 */
export default function EmpresaLogo({
  name, color, slug, size = 56, rounded = 'rounded-2xl', logoUrl,
}: {
  name: string
  color: string
  slug: string
  size?: number
  rounded?: string
  logoUrl?: string
}) {
  const [err, setErr] = useState(false)
  const initials = name.split(' ').filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join('').toUpperCase()
  const src = logoUrl || `/empresas/${slug}.png`

  if (err) {
    return (
      <div className={`${rounded} flex items-center justify-center font-extrabold text-white flex-shrink-0`}
        style={{ width: size, height: size, background: `linear-gradient(135deg, ${color}, ${shade(color, -18)})`, fontSize: size * 0.34 }}>
        {initials}
      </div>
    )
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img src={src} alt={name} width={size} height={size}
      className={`${rounded} object-contain bg-white flex-shrink-0`} style={{ width: size, height: size }}
      onError={() => setErr(true)} />
  )
}

// Oscurece/aclara un hex
function shade(hex: string, percent: number) {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.max(0, Math.min(255, (n >> 16) + percent))
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + percent))
  const b = Math.max(0, Math.min(255, (n & 0xff) + percent))
  return `rgb(${r},${g},${b})`
}
