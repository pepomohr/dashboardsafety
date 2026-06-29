'use client'

import { ReactNode } from 'react'
import Logo from './Logo'
import { COLORS } from '@/lib/theme'

export interface NavItem {
  id: string
  label: string
  icon: ReactNode
  hint?: string
}

function NavList({ items, active, onPick }: { items: NavItem[]; active: string; onPick: (id: string) => void }) {
  return (
    <nav className="flex-1 p-3 space-y-1">
      {items.map(it => {
        const a = active === it.id
        return (
          <button key={it.id} onClick={() => onPick(it.id)}
            className="group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={a
              ? { background: `linear-gradient(100deg, ${COLORS.green}, ${COLORS.greenDark})`, color: '#fff', boxShadow: '0 6px 16px -6px rgba(78,139,44,.6)' }
              : { color: COLORS.grayDark }}
            onMouseEnter={e => { if (!a) e.currentTarget.style.backgroundColor = '#EEF3EA' }}
            onMouseLeave={e => { if (!a) e.currentTarget.style.backgroundColor = 'transparent' }}>
            {a && <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full" style={{ backgroundColor: COLORS.greenDark }} />}
            <span className="flex-shrink-0">{it.icon}</span>
            <span className="flex-1 text-left">{it.label}</span>
            {it.hint && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={a ? { backgroundColor: 'rgba(255,255,255,.25)', color: '#fff' } : { backgroundColor: '#FBE9E5', color: '#9A2A18' }}>
                {it.hint}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}

function Inner({ items, active, onPick, role, empresa }: {
  items: NavItem[]; active: string; onPick: (id: string) => void; role?: string; empresa?: string
}) {
  return (
    <>
      <div className="h-16 flex items-center gap-2.5 px-4 border-b border-gray-100">
        <Logo size={36} />
        <div className="leading-tight">
          <p className="font-display font-extrabold text-[15px]">
            <span style={{ color: COLORS.green }}>Safety</span>{' '}
            <span style={{ color: COLORS.gray }}>Services</span>
          </p>
          <p className="text-[10px] tracking-wide" style={{ color: COLORS.gray }}>HIGIENE Y SEGURIDAD</p>
        </div>
      </div>

      <NavList items={items} active={active} onPick={onPick} />

      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${COLORS.green}, ${COLORS.greenDark})` }}>
            {(empresa ?? 'S').charAt(0)}
          </div>
          <div className="min-w-0">
            {role && <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: COLORS.green }}>{role}</p>}
            <p className="text-xs font-medium truncate" style={{ color: COLORS.grayDark }}>{empresa}</p>
          </div>
        </div>
        <p className="text-[10px] mt-2 px-2" style={{ color: COLORS.grayMid }}>Ing. Eduardo Klopp · v1.0</p>
      </div>
    </>
  )
}

export default function Sidebar({
  items, active, onChange, role, empresa, open = false, onClose,
}: {
  items: NavItem[]
  active: string
  onChange: (id: string) => void
  role?: string
  empresa?: string
  open?: boolean
  onClose?: () => void
}) {
  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 bg-white border-r border-gray-200 min-h-screen sticky top-0 self-start">
        <Inner items={items} active={active} onPick={onChange} role={role} empresa={empresa} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-2xl flex flex-col ss-animate">
            <Inner items={items} active={active} onPick={(id) => { onChange(id); onClose?.() }} role={role} empresa={empresa} />
          </aside>
        </div>
      )}
    </>
  )
}
