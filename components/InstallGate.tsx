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
              className="flex-shrink-0 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90"
              style={{ backgroundColor: COLORS.green }}>
              Instalar
            </button>
            <button onClick={cerrar} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-100" aria-label="Cerrar">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={COLORS.gray} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Guía iPhone: pasos GRANDES + flecha animada al botón Compartir (abajo) */}
      {guiaIOS && (
        <div className="fixed inset-0 z-[95] flex flex-col">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setGuiaIOS(false)} />

          {/* Tarjeta con los pasos, grande y clara */}
          <div className="relative m-4 mt-16 bg-white rounded-3xl shadow-2xl p-6">
            <button onClick={() => { setGuiaIOS(false); cerrar() }} className="absolute top-3 right-3 p-2 rounded-lg hover:bg-gray-100" aria-label="Cerrar">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={COLORS.gray} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="w-14 h-14 mx-auto mb-3" />
            <h3 className="text-xl font-extrabold text-center mb-1" style={{ color: COLORS.grayDark }}>Poné la app en tu inicio</h3>
            <p className="text-sm text-center mb-5" style={{ color: COLORS.gray }}>Son 3 toques. Seguí la flecha 👇</p>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="w-9 h-9 rounded-full flex items-center justify-center text-base font-extrabold flex-shrink-0" style={{ backgroundColor: COLORS.greenLight, color: COLORS.greenDark }}>1</span>
                <p className="text-base flex-1" style={{ color: COLORS.grayDark }}>Tocá el botón <b>Compartir</b></p>
                <span className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ border: `2px solid ${COLORS.green}` }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={COLORS.green} strokeWidth="2" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4l4 4M6 12v6a2 2 0 002 2h8a2 2 0 002-2v-6" /></svg>
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-9 h-9 rounded-full flex items-center justify-center text-base font-extrabold flex-shrink-0" style={{ backgroundColor: COLORS.greenLight, color: COLORS.greenDark }}>2</span>
                <p className="text-base flex-1" style={{ color: COLORS.grayDark }}>Bajá y tocá <b>“Agregar a inicio”</b></p>
                <span className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ border: `2px solid ${COLORS.green}` }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={COLORS.green} strokeWidth="2" className="w-6 h-6"><rect x="4" y="4" width="16" height="16" rx="4" /><path strokeLinecap="round" d="M12 8v8M8 12h8" /></svg>
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-9 h-9 rounded-full flex items-center justify-center text-base font-extrabold flex-shrink-0" style={{ backgroundColor: COLORS.greenLight, color: COLORS.greenDark }}>3</span>
                <p className="text-base flex-1" style={{ color: COLORS.grayDark }}>Tocá <b>“Agregar”</b> arriba</p>
                <span className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ border: `2px solid ${COLORS.green}` }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={COLORS.green} strokeWidth="2.2" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </span>
              </div>
            </div>
          </div>

          {/* Flecha animada apuntando al botón Compartir de Safari (abajo-centro) */}
          <div className="relative mt-auto mb-2 flex flex-col items-center ss-bounce">
            <span className="mb-1 px-3 py-1 rounded-full text-white text-xs font-bold" style={{ backgroundColor: COLORS.green }}>Compartir está acá</span>
            <svg viewBox="0 0 24 24" fill={COLORS.green} className="w-10 h-10 drop-shadow-lg"><path d="M12 21l-8-9h5V3h6v9h5z" /></svg>
          </div>

          <style jsx>{`
            .ss-bounce { animation: ssB 1s ease-in-out infinite; }
            @keyframes ssB { 0%,100% { transform: translateY(0) } 50% { transform: translateY(10px) } }
          `}</style>
        </div>
      )}
    </>
  )
}
