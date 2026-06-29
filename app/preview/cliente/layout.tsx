import InstallGate from '@/components/InstallGate'

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return <InstallGate>{children}</InstallGate>
}
