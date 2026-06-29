import { ReactNode } from 'react'
import { COLORS } from '@/lib/theme'

export default function Card({
  title, children, className = '', action,
}: {
  title?: string
  children: ReactNode
  className?: string
  action?: ReactNode
}) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-sm font-bold uppercase tracking-wide" style={{ color: COLORS.grayDark }}>{title}</h3>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}
