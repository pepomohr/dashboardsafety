'use client'

import Link from 'next/link'
import { COLORS } from '@/lib/theme'

/**
 * Switch flotante para alternar entre la vista de Admin (Colo) y la de Cliente.
 * Es solo para la maqueta/demo — en producción cada usuario entra a su rol.
 */
export default function DemoSwitcher({ current }: { current: 'admin' | 'cliente' }) {
  const items: { id: 'admin' | 'cliente'; label: string; href: string }[] = [
    { id: 'admin', label: 'Admin', href: '/preview/admin' },
    { id: 'cliente', label: 'Cliente', href: '/preview/cliente' },
  ]
  return (
    <div className="no-print fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
      <div className="flex items-center gap-1 rounded-full p-1 shadow-xl border border-gray-200"
        style={{ backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)' }}>
        <span className="text-[10px] font-bold uppercase tracking-wide px-2 hidden sm:inline" style={{ color: COLORS.grayMid }}>Maqueta · ver como</span>
        {items.map(it => {
          const active = it.id === current
          return (
            <Link key={it.id} href={it.href}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors"
              style={active ? { backgroundColor: COLORS.green, color: '#fff' } : { color: COLORS.grayDark }}>
              {it.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
