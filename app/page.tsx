import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8" style={{ backgroundColor: '#F4F5F3' }}>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#3D3D3D' }}>
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#6FB63F" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-xl font-bold"><span style={{ color: '#6FB63F' }}>Safety</span> <span style={{ color: '#7A7A7A' }}>Services</span></p>
          <p className="text-sm" style={{ color: '#7A7A7A' }}>Tablero de gestión de Higiene y Seguridad</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link href="/preview/admin"
          className="text-center px-6 py-3.5 rounded-xl text-white font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#3D3D3D' }}>
          Panel del Colo (admin) →
        </Link>
        <Link href="/preview/cliente"
          className="text-center px-6 py-3.5 rounded-xl text-white font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#6FB63F' }}>
          Dashboard del cliente →
        </Link>
        <p className="text-center text-xs" style={{ color: '#A8A8A8' }}>Vista previa · datos de ejemplo</p>
      </div>
    </main>
  )
}
