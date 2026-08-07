'use client'

import { useEffect, useState, ReactNode } from 'react'
import { COLORS } from '@/lib/theme'
import Logo from './Logo'

/**
 * En el celular (navegador, no instalada) muestra una pantalla que invita a instalar
 * la app y a activar notificaciones — como pidió el Colo. En PC o ya instalada como
 * PWA, deja pasar directo al tablero. Incluye un bypass "ver en el navegador" para la demo.
 */
export default function InstallGate({ children }: { children: ReactNode }) {
  // Por defecto muestra la app (así el SSR y el PC no parpadean); en celu-navegador
  // pasa a 'gate' después de montar.
  const [decision, setDecision] = useState<'app' | 'gate'>('app')
  const [deferred, setDeferred] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [iosSafari, setIosSafari] = useState(true)   // en iPhone, instalar solo funciona desde Safari
  const [notif, setNotif] = useState<NotificationPermission | 'unsupported'>('default')

  useEffect(() => {
    // Registrar service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
    if ('Notification' in window) setNotif(Notification.permission)
    else setNotif('unsupported')

    const ua = navigator.userAgent || ''
    const ios = /iphone|ipad|ipod/i.test(ua) || (/Mac/.test(ua) && 'ontouchend' in document)
    setIsIOS(ios)
    // Safari real (no Chrome/Firefox/in-app en iOS, que no pueden instalar PWAs)
    setIosSafari(/safari/i.test(ua) && !/crios|fxios|edgios|instagram|fbav|line/i.test(ua))

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true
    const isMobile = window.matchMedia('(max-width: 767px)').matches || /android|iphone|ipad|ipod/i.test(ua)

    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e) }
    window.addEventListener('beforeinstallprompt', onPrompt)

    // PC o ya instalada → app directa. Celu en navegador → pantalla de instalación.
    if (!(standalone || !isMobile)) setDecision('gate')

    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  async function instalar() {
    if (deferred) {
      deferred.prompt()
      const res = await deferred.userChoice.catch(() => null)
      if (res?.outcome === 'accepted') setDecision('app')
      setDeferred(null)
    }
  }

  async function pedirNotif() {
    if (!('Notification' in window)) return
    const p = await Notification.requestPermission()
    setNotif(p)
    if (p === 'granted') {
      new Notification('Safety Services', { body: 'Te vamos a avisar cuando un documento esté por vencer.', icon: '/icon.svg' })
    }
  }

  if (decision === 'app') return <>{children}</>

  // ── Pantalla de instalación (celular) ──
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: COLORS.bg }}>
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-5"><Logo size={72} /></div>
        <h1 className="font-display text-2xl font-extrabold" style={{ color: COLORS.grayDark }}>
          <span style={{ color: COLORS.green }}>Safety</span> <span style={{ color: COLORS.gray }}>Services</span>
        </h1>
        <p className="text-sm mt-2" style={{ color: COLORS.gray }}>
          Para acceder a tu documentación, instalá la app en tu teléfono. Es gratis y ocupa segundos.
        </p>

        <div className="mt-7 space-y-3">
          {isIOS ? (
            <div className="rounded-2xl bg-white border border-gray-100 p-5 text-left shadow-sm">
              {!iosSafari ? (
                <div className="flex flex-col items-center text-center gap-2">
                  <span className="text-3xl">🧭</span>
                  <p className="text-sm font-semibold" style={{ color: COLORS.grayDark }}>Abrí esta página en Safari</p>
                  <p className="text-xs" style={{ color: COLORS.gray }}>
                    En iPhone la app solo se instala desde <b>Safari</b>. Tocá los <b>···</b> o el botón de compartir y elegí <b>“Abrir en Safari”</b>, y volvé a esta pantalla.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm font-semibold mb-3 text-center" style={{ color: COLORS.grayDark }}>Instalala en tu iPhone en 3 pasos</p>
                  <div className="space-y-3">
                    {[
                      { n: '1', t: <>Tocá el botón <b>Compartir</b> en la barra de abajo</>, i: (
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={COLORS.green} strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4l4 4M6 12v6a2 2 0 002 2h8a2 2 0 002-2v-6" /></svg>
                      ) },
                      { n: '2', t: <>Deslizá y elegí <b>“Agregar a inicio”</b></>, i: (
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={COLORS.green} strokeWidth={1.8}><rect x="4" y="4" width="16" height="16" rx="4" /><path strokeLinecap="round" d="M12 8v8M8 12h8" /></svg>
                      ) },
                      { n: '3', t: <>Confirmá <b>“Agregar”</b> arriba a la derecha</>, i: (
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={COLORS.green} strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      ) },
                    ].map(p => (
                      <div key={p.n} className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: COLORS.greenLight, color: COLORS.greenDark }}>{p.n}</span>
                        <span className="text-sm flex-1" style={{ color: COLORS.grayDark }}>{p.t}</span>
                        <span className="flex-shrink-0">{p.i}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] mt-3 text-center" style={{ color: COLORS.grayMid }}>
                    Queda con el ícono de Safety Services, como una app más.
                  </p>
                </>
              )}
            </div>
          ) : (
            <button onClick={instalar} disabled={!deferred}
              className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ backgroundColor: COLORS.green }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {deferred ? 'Instalar la app' : 'Abrí desde Chrome para instalar'}
            </button>
          )}

          {/* Notificaciones */}
          <button onClick={pedirNotif} disabled={notif === 'granted' || notif === 'unsupported'}
            className="w-full py-3 rounded-2xl font-semibold text-sm border-2 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ borderColor: COLORS.green, color: COLORS.greenDark, backgroundColor: '#fff' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notif === 'granted' ? 'Notificaciones activadas ✓' : 'Activar notificaciones'}
          </button>
        </div>

        <button onClick={() => setDecision('app')} className="mt-6 text-xs underline" style={{ color: COLORS.grayMid }}>
          Continuar en el navegador
        </button>
      </div>
    </div>
  )
}
