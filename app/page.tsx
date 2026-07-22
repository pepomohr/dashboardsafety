import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8" style={{ backgroundColor: '#F4F5F3' }}>
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Safety Services" width={84} height={84} style={{ width: 84, height: 84, objectFit: 'contain' }} />
        <div>
          <p className="font-display text-3xl font-extrabold leading-none"><span style={{ color: '#6FB63F' }}>Safety</span> <span style={{ color: '#7A7A7A' }}>Services</span></p>
          <p className="text-sm mt-1.5" style={{ color: '#7A7A7A' }}>Tablero de gestión de Higiene y Seguridad</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link href="/preview/admin"
          className="text-center px-6 py-3.5 rounded-xl text-white font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#3D3D3D' }}>
          Panel de administración →
        </Link>
        <Link href="/preview/cliente"
          className="text-center px-6 py-3.5 rounded-xl text-white font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#6FB63F' }}>
          Dashboard del cliente →
        </Link>
      </div>
    </main>
  )
}
