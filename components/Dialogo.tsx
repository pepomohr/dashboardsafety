'use client'

import { useState, useCallback, useEffect } from 'react'
import { COLORS } from '@/lib/theme'

/**
 * Diálogos propios de Safety Services, para no usar los alert() y confirm()
 * del navegador (que son feos y distintos en cada máquina).
 *
 * Uso:
 *   const { confirmar, avisar, Dialogo } = useDialogo()
 *   if (await confirmar({ titulo: '¿Eliminar?', peligro: true })) { ... }
 *   await avisar('No se pudo guardar')
 *   ...y en el render:  {Dialogo}
 */

type Tipo = 'confirmar' | 'aviso'

interface Opciones {
  titulo: string
  mensaje?: string
  detalle?: string          // línea chica de advertencia (ej: "no se puede deshacer")
  confirmarTexto?: string
  peligro?: boolean         // pinta el botón principal de rojo
}

interface Estado extends Opciones {
  abierto: boolean
  tipo: Tipo
  resolver?: (v: boolean) => void
}

const CERRADO: Estado = { abierto: false, tipo: 'aviso', titulo: '' }

export function useDialogo() {
  const [st, setSt] = useState<Estado>(CERRADO)

  const confirmar = useCallback((o: Opciones) =>
    new Promise<boolean>(resolver => setSt({ ...o, abierto: true, tipo: 'confirmar', resolver })), [])

  const avisar = useCallback((titulo: string, mensaje?: string) =>
    new Promise<boolean>(resolver => setSt({ titulo, mensaje, abierto: true, tipo: 'aviso', resolver })), [])

  const cerrar = useCallback((v: boolean) => {
    setSt(s => { s.resolver?.(v); return CERRADO })
  }, [])

  // Escape cancela, Enter confirma
  useEffect(() => {
    if (!st.abierto) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); cerrar(false) }
      if (e.key === 'Enter') { e.preventDefault(); cerrar(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [st.abierto, cerrar])

  const esPeligro = !!st.peligro
  const principal = esPeligro ? COLORS.danger : COLORS.green

  const Dialogo = st.abierto ? (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm ss-fade" onClick={() => cerrar(false)} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden ss-pop">
        {/* Franja de color de marca */}
        <div className="h-1.5" style={{ backgroundColor: principal }} />

        <div className="px-6 pt-6 pb-5 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: esPeligro ? '#FBE9E5' : COLORS.greenLight }}>
            {esPeligro ? (
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke={COLORS.danger} strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.74-3L13.74 4a2 2 0 00-3.48 0L3.33 16a2 2 0 001.74 3z" />
              </svg>
            ) : (
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke={COLORS.green} strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>

          <h3 className="font-display text-lg font-extrabold leading-snug" style={{ color: COLORS.grayDark }}>{st.titulo}</h3>
          {st.mensaje && <p className="text-sm mt-2" style={{ color: COLORS.gray }}>{st.mensaje}</p>}
          {st.detalle && (
            <p className="text-xs mt-3 rounded-xl px-3 py-2" style={{ backgroundColor: COLORS.bg, color: COLORS.grayMid }}>{st.detalle}</p>
          )}
        </div>

        <div className="px-6 pb-6 flex flex-col-reverse sm:flex-row gap-2">
          {st.tipo === 'confirmar' && (
            <button onClick={() => cerrar(false)}
              className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-gray-50 transition-colors"
              style={{ color: COLORS.gray }}>
              Cancelar
            </button>
          )}
          <button onClick={() => cerrar(true)} autoFocus
            className="flex-1 py-3 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: principal }}>
            {st.confirmarTexto || (st.tipo === 'confirmar' ? 'Eliminar' : 'Entendido')}
          </button>
        </div>
      </div>

      <style jsx>{`
        .ss-fade { animation: ssFade .18s ease-out; }
        .ss-pop  { animation: ssPop .22s cubic-bezier(.2,.9,.3,1.2); }
        @keyframes ssFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes ssPop  { from { opacity: 0; transform: translateY(14px) scale(.96) } to { opacity: 1; transform: none } }
      `}</style>
    </div>
  ) : null

  return { confirmar, avisar, Dialogo }
}
