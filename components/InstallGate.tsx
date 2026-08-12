'use client'

import { useEffect, useState, ReactNode } from 'react'
import { COLORS } from '@/lib/theme'

/**
 * NO bloquea: el cliente ve su tablero directo. Si está en celu y todavía no
 * instaló la app, aparece una barrita abajo para instalarla (opcional):
 *  · Android → botón "Instalar app" (un toque + confirmar).
 *  · iPhone → guía corta "Compartir → Agregar a inicio" (Apple no permite un-click).
 * Se puede cerrar y no vuelve a molestar.
 */
export default function InstallGate({ children }: { children: ReactNode }) {
  const [deferred, setDeferred] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [mostrar, setMostrar] = useState(false)
  const [guiaIOS, setGuiaIOS] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})

    const ua = navigator.userAgent || ''
    const ios = /iphone|ipad|ipod/i.test(ua) || (/Mac/.test(ua) && 'ontouchend' in document)
    setIsIOS(ios)

    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
    const isMobile = /android|iphone|ipad|ipod/i.test(ua) || window.matchMedia('(max-width: 767px)').matches
    const cerrado = (() => { try { return localStorage.getItem('ss_install_cerrado') === '1' } catch { return false } })()

    // Mostrar la barrita solo en celu, sin instalar y si no la cerró antes
    if (isMobile && !standalone && !cerrado) setMostrar(true)

    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', () => setMostrar(false))
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  async function instalar() {
    if (deferred) {
      deferred.prompt()
      const res = await deferred.userChoice.catch(() => null)
      if (res?.outcome === 'accepted') setMostrar(false)
      setDeferred(null)
    } else if (isIOS) {
      setGuiaIOS(true)
    }
  }

  function cerrar() {
    setMostrar(false)
    try { localStorage.setItem('ss_install_cerrado', '1') } catch {}
  }

  return (
    <>
      {children}

      {mostrar && (
        <div className="fixed bottom-0 left-0 right-0 z-[90] p-3 sm:p-4">
          <div className="mx-auto max-w-md rounded-2xl shadow-2xl border border-gray-100 bg-white px-4 py-3 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="w-9 h-9 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-tight" style={{ color: COLORS.grayDark }}>Instalá la app</p>
              <p className="text-xs" style={{ color: COLORS.gray }}>Accedé más rápido, como una app más.</p>
            </div>
            <button onClick={instalar}
              className="flex-shrink-0 px-3.5 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90"
              style={{ backgroundColor: COLORS.green }}>
              {isIOS ? 'Cómo' : 'Instalar'}
            </button>
            <button onClick={cerrar} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-100" aria-label="Cerrar">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={COLORS.gray} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Guía iPhone (Apple no deja instalar de un toque) */}
      {guiaIOS && (
        <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setGuiaIOS(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
            <p className="text-sm font-bold text-center mb-3" style={{ color: COLORS.grayDark }}>Instalala en tu iPhone</p>
            <div className="space-y-3">
              {[
                { n: '1', t: <>Tocá <b>Compartir</b> (la barra de abajo, o el menú <b>···</b>)</> },
                { n: '2', t: <>Elegí <b>“Agregar a inicio”</b></> },
                { n: '3', t: <>Confirmá <b>“Agregar”</b></> },
              ].map(p => (
                <div key={p.n} className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: COLORS.greenLight, color: COLORS.greenDark }}>{p.n}</span>
                  <span className="text-sm" style={{ color: COLORS.grayDark }}>{p.t}</span>
                </div>
              ))}
            </div>
            <button onClick={() => { setGuiaIOS(false); cerrar() }} className="mt-5 w-full py-2.5 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: COLORS.green }}>Entendido</button>
          </div>
        </div>
      )}
    </>
  )
}
