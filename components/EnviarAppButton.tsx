'use client'

import { useState } from 'react'
import { COLORS } from '@/lib/theme'

/**
 * Botón para el admin: copia al portapapeles el link de la app del cliente actual,
 * así el Colo lo pega y se lo envía a la empresa.
 */
export default function EnviarAppButton({ slug, sucursal }: { slug: string; sucursal?: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${origin}/preview/cliente?empresa=${slug}${sucursal ? `&sucursal=${sucursal}` : ''}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = url; document.body.appendChild(ta); ta.select()
      try { document.execCommand('copy') } catch {}
      ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  return (
    <button onClick={copy}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
      style={copied
        ? { backgroundColor: COLORS.greenLight, color: COLORS.greenDark }
        : { color: COLORS.grayDark, border: `1px dashed ${COLORS.grayMid}` }}
      title="Copiar el link de la app de este cliente">
      {copied ? (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      )}
      {copied ? '¡Link copiado!' : 'Enviar App'}
    </button>
  )
}
