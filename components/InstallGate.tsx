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
  const [iosNav, setIosNav] = useState<'safari' | 'chrome'>('safari')
  const [mostrar, setMostrar] = useState(false)
  const [guiaIOS, setGuiaIOS] = useState(false)
  const [guiaAndroid, setGuiaAndroid] = useState(false)
  const [paso, setPaso] = useState(0)

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})

    const ua = navigator.userAgent || ''
    const ios = /iphone|ipad|ipod/i.test(ua) || (/Mac/.test(ua) && 'ontouchend' in document)
    setIsIOS(ios)
    // Chrome en iOS = "CriOS"; el resto lo tratamos como Safari
    setIosNav(/crios/i.test(ua) ? 'chrome' : 'safari')

    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
    const isMobile = /android|iphone|ipad|ipod/i.test(ua) || window.matchMedia('(max-width: 767px)').matches
    const cerrado = (() => { try { return localStorage.getItem('ss_install_cerrado') === '1' } catch { return false } })()

    // Mostrar la barrita solo en celu, sin instalar y si no la cerró antes
    if (isMobile && !standalone && !cerrado) setMostrar(true)

    // Evento capturado temprano por el script del layout (Android)
    if ((window as any).__ssInstall) setDeferred((window as any).__ssInstall)
    const onReady = () => setDeferred((window as any).__ssInstall)
    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e) }
    window.addEventListener('ss-install-ready', onReady)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', () => setMostrar(false))
    return () => {
      window.removeEventListener('ss-install-ready', onReady)
      window.removeEventListener('beforeinstallprompt', onPrompt)
    }
  }, [])

  async function instalar() {
    if (deferred) {
      deferred.prompt()
      const res = await deferred.userChoice.catch(() => null)
      if (res?.outcome === 'accepted') setMostrar(false)
      setDeferred(null)
    } else if (isIOS) {
      setPaso(0)
      setGuiaIOS(true)
    } else {
      // Android sin evento disponible (ya lo mostró, o el navegador no lo ofrece):
      // le explicamos cómo instalar desde el menú.
      setGuiaAndroid(true)
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

      {/* Respaldo Android: cuando el navegador no ofrece el botón automático */}
      {guiaAndroid && (
        <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setGuiaAndroid(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="w-12 h-12 mx-auto mb-3" />
            <h3 className="text-lg font-extrabold mb-1" style={{ color: COLORS.grayDark }}>Instalá la app</h3>
            <p className="text-sm mb-4" style={{ color: COLORS.gray }}>
              Tocá el menú <b>⋮</b> arriba a la derecha del navegador y elegí <b>“Instalar app”</b> o <b>“Agregar a pantalla principal”</b>.
            </p>
            <button onClick={() => { setGuiaAndroid(false); cerrar() }} className="w-full py-2.5 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: COLORS.green }}>Entendido</button>
          </div>
        </div>
      )}

      {/* Guía iPhone: carrusel de fotos reales (Safari o Chrome, según detección).
          Cada navegador puede tener DISTINTA cantidad de pasos. */}
      {guiaIOS && (() => {
        const CANT: Record<string, number> = { safari: 4, chrome: 5 } // ← cambiar acá si suben más/menos
        const cant = CANT[iosNav] ?? 4
        const pasos = Array.from({ length: cant }, (_, i) => ({ img: `/install/${iosNav}-${i + 1}.jpg` }))
        const ultimo = paso === pasos.length - 1
        return (
          <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setGuiaIOS(false)} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs overflow-hidden flex flex-col" style={{ maxHeight: '92vh' }}>
              <div className="px-5 pt-5 pb-3 text-center">
                <h3 className="text-lg font-extrabold" style={{ color: COLORS.grayDark }}>Instalar en iPhone</h3>
                <p className="text-xs mt-0.5" style={{ color: COLORS.gray }}>Paso {paso + 1} de {pasos.length} · {iosNav === 'chrome' ? 'Chrome' : 'Safari'}</p>
              </div>

              {/* Foto del paso */}
              <div className="flex-1 min-h-0 px-5 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pasos[paso].img} alt={`Paso ${paso + 1}`}
                  className="max-w-full rounded-xl border border-gray-100"
                  style={{ maxHeight: '52vh', objectFit: 'contain' }}
                  onError={e => { e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='320'%3E%3Crect width='100%25' height='100%25' fill='%23f2f4f1'/%3E%3Ctext x='50%25' y='50%25' font-size='72' text-anchor='middle' fill='%236FB63F' font-family='sans-serif' dy='.35em'%3E${paso + 1}%3C/text%3E%3C/svg%3E` }} />
              </div>

              <p className="px-6 pt-3 text-center text-sm font-semibold" style={{ color: COLORS.grayDark }}>Seguí el círculo rojo de la foto 👆</p>

              {/* Puntitos */}
              <div className="flex justify-center gap-1.5 py-3">
                {pasos.map((_, i) => (
                  <button key={i} onClick={() => setPaso(i)} className="w-2 h-2 rounded-full transition-colors"
                    style={{ backgroundColor: i === paso ? COLORS.green : '#D6DAD4' }} aria-label={`Paso ${i + 1}`} />
                ))}
              </div>

              {/* Navegación */}
              <div className="px-5 pb-5 flex items-center gap-2">
                {paso > 0 && (
                  <button onClick={() => setPaso(p => p - 1)} className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200" style={{ color: COLORS.gray }}>Atrás</button>
                )}
                {ultimo ? (
                  <button onClick={() => { setGuiaIOS(false); cerrar() }} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: COLORS.green }}>¡Listo!</button>
                ) : (
                  <button onClick={() => setPaso(p => p + 1)} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: COLORS.green }}>Siguiente</button>
                )}
              </div>

              <button onClick={() => setGuiaIOS(false)} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-gray-100" aria-label="Cerrar">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={COLORS.gray} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
        )
      })()}
    </>
  )
}
