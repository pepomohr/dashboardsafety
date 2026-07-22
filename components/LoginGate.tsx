'use client'

import { useState, useEffect, ReactNode } from 'react'
import { supabase, signIn, signOut, getProfile } from '@/lib/supabase'
import { COLORS } from '@/lib/theme'
import Logo from './Logo'

/**
 * Puerta de acceso. Si no hay sesión, muestra el login. Si hay sesión válida
 * (y admin, cuando requireAdmin), renderiza la app. Solo se usa con Supabase conectado.
 */
export default function LoginGate({ children, requireAdmin = false }: { children: ReactNode; requireAdmin?: boolean }) {
  const [status, setStatus] = useState<'loading' | 'in' | 'out' | 'denied'>('loading')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    const check = () => getProfile().then(p => {
      if (!mounted) return
      if (!p) setStatus('out')
      else if (requireAdmin && p.role !== 'admin') setStatus('denied')
      else setStatus('in')
    })
    check()
    const { data: sub } = supabase!.auth.onAuthStateChange(() => check())
    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [requireAdmin])

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setLoading(true)
    const { error } = await signIn(email, pass)
    if (error) { setErr('Email o contraseña incorrectos.'); setLoading(false) }
    // si sale bien, onAuthStateChange actualiza el estado
  }

  if (status === 'loading') return null
  if (status === 'in') return <>{children}</>

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: COLORS.bg }}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="flex flex-col items-center mb-6">
          <Logo size={56} />
          <p className="font-display text-xl font-extrabold mt-3">
            <span style={{ color: COLORS.green }}>Safety</span> <span style={{ color: COLORS.gray }}>Services</span>
          </p>
          <p className="text-sm mt-1" style={{ color: COLORS.gray }}>Panel de administración</p>
        </div>

        {status === 'denied' ? (
          <div className="text-center space-y-4">
            <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: '#FBE9E5', color: '#9A2A18' }}>
              Esta cuenta no tiene permisos de administrador.
            </div>
            <button onClick={() => signOut()} className="text-sm font-semibold" style={{ color: COLORS.greenDark }}>Salir e ingresar con otra cuenta</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: COLORS.gray }}>Email</label>
              <input type="email" name="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username email"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                style={{ color: COLORS.grayDark }} placeholder="tu@email.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: COLORS.gray }}>Contraseña</label>
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} required autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                style={{ color: COLORS.grayDark }} placeholder="••••••••" />
            </div>
            {err && <div className="rounded-xl px-4 py-2.5 text-sm" style={{ backgroundColor: '#FBE9E5', color: '#9A2A18' }}>{err}</div>}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-60"
              style={{ backgroundColor: COLORS.green }}>
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        )}
      </div>
      <p className="text-xs mt-6" style={{ color: COLORS.grayMid }}>© {new Date().getFullYear()} Safety Services · Higiene y Seguridad</p>
    </div>
  )
}
