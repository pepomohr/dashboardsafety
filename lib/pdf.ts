/**
 * Descarga de un bloque de HTML como archivo PDF, sin pasar por el diálogo
 * de impresión del navegador. Las librerías se cargan sólo cuando se usan
 * (import dinámico), así no engordan la carga inicial de la app.
 */

/** Nombre de archivo seguro: sin acentos ni caracteres raros. */
function nombreArchivo(base: string) {
  const limpio = base
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const hoy = new Date().toISOString().slice(0, 10)
  return `${limpio || 'informe'}-${hoy}.pdf`
}

/**
 * Convierte el elemento en PDF A4 (varias páginas si hace falta) y lo descarga.
 * Devuelve true si salió bien.
 */
export async function descargarComoPDF(elemento: HTMLElement, titulo: string): Promise<boolean> {
  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ])

    const lienzo = await html2canvas(elemento, {
      scale: 2,                 // el doble de resolución: el texto no sale borroso
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      windowWidth: 820,         // ancho fijo: el PDF sale igual desde el celular que desde la PC
    })

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
    const anchoPag = pdf.internal.pageSize.getWidth()
    const altoPag = pdf.internal.pageSize.getHeight()

    const margen = 8
    const ancho = anchoPag - margen * 2
    const alto = (lienzo.height * ancho) / lienzo.width
    const imagen = lienzo.toDataURL('image/jpeg', 0.95)

    // Si es más largo que una hoja, lo va corriendo hacia arriba y agrega páginas.
    let restante = alto
    let posicion = margen
    pdf.addImage(imagen, 'JPEG', margen, posicion, ancho, alto)
    restante -= altoPag - margen * 2

    while (restante > 0) {
      posicion -= altoPag - margen * 2
      pdf.addPage()
      pdf.addImage(imagen, 'JPEG', margen, posicion, ancho, alto)
      restante -= altoPag - margen * 2
    }

    pdf.save(nombreArchivo(titulo))
    return true
  } catch (e) {
    console.error('descargarComoPDF:', e)
    return false
  }
}
