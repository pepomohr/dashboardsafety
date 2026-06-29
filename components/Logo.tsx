'use client'

import { useState } from 'react'
import { COLORS } from '@/lib/theme'

/**
 * Logo de Safety Services.
 * Busca el archivo real en /public/logo.jpg. Si todavía no está, muestra un fallback.
 * Para usar el logo real: guardá la imagen v6 como  public/logo.jpg
 */
export default function Logo({ size = 44 }: { size?: number }) {
  const [err, setErr] = useState(false)

  if (err) {
    return (
      <div style={{ width: size, height: size, backgroundColor: COLORS.grayDark }}
        className="rounded-xl flex items-center justify-center flex-shrink-0">
        <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none" stroke={COLORS.green} strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    )
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img src="/logo.jpg" alt="Safety Services" width={size} height={size}
      style={{ objectFit: 'contain', flexShrink: 0 }} onError={() => setErr(true)} />
  )
}
