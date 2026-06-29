# Safety Services — Dashboard · Estado del proyecto

Tablero de siniestralidad + gestión documental para Safety Services (Ing. Eduardo Klopp).
Stack: **Next.js 14 + Tailwind + Recharts + react-body-highlighter + SheetJS (xlsx)**.
Colores de marca: verde `#6FB63F`, gris `#3D3D3D`, blanco. **Sin Supabase todavía** (datos de ejemplo en memoria).

## Cómo correrlo
```
cd safetyservices-dashboard
npm install
npm run dev      # http://localhost:3100  (o el puerto que asigne)
```
Rutas:
- `/` → menú con accesos
- `/preview/cliente` → app de la empresa cliente
- `/preview/admin` → panel del Colo

---

## ✅ Hecho

### Dashboard del cliente (`/preview/cliente`)
- Sidebar (Dashboard / Documentación) + drawer en mobile + logo.
- Índices (frecuencia, gravedad, incidencia, accidentes acumulados).
- **Filtros funcionales**: año (escala datos), mes (filtra período), rango desde–hasta.
- Accidentes por mes (área), por área, por turno (con %), tipo de lesión.
- Investigación de accidentes (torta).
- **Estado documental**: velocímetro que muestra SIEMPRE el documento más urgente + torta Vigentes/Por vencer/Vencidos + lista de los 28 documentos.
- **Cuerpo anatómico** (frente/espalda) con zonas pintadas según lesiones + lista por zona.
- **Campanita** dinámica (avisos reales de docs por vencer/vencidos) que se sacude.
- **Descargar informe PDF** (vista previa + Guardar como PDF) con firma del Ing. Klopp.

### Panel del Colo (`/preview/admin`)
- Grilla de **clientes con cards estilo C427** (banda de color, nombre, "Cliente oficial de Safety Services", logo, estado documental).
- **Alta de cliente** por modal (nombre, rubro, sede, color de marca, cliente/prospecto) con preview en vivo.
- Al entrar a una empresa (datos aislados, sin mezclar) → tabs:
  - **Dashboard** de esa empresa.
  - **Carga de accidentes**: switch entre *formulario* (fecha, hora, turno, área, parte del cuerpo con buscador, tipo de lesión, investigación) y *tocar el cuerpo* (figura clickeable). **Importar Excel** real (SheetJS) que mapea columnas; avisa con transparencia si no las reconoce.
  - **Carga de documentación**: tipo + fecha de vencimiento + archivo → aparece en la lista con su semáforo.
  - Alerta "⚠️ Atención: X documentos vencidos · 5 accidentes sin investigar".
  - **Informe PDF** por empresa con firma.

### PWA (instalable)
- `manifest.json`, `sw.js` (service worker), ícono.
- En **celular** (navegador): pantalla que invita a **instalar la app** + **activar notificaciones** (con bypass "ver en navegador" para la demo).
- En PC / ya instalada: entra directo.

---

## ⏳ Pendiente / para revisar juntos
- **Cuerpo anatómico (✅ resuelto)**: se reemplazó el dibujo a mano por un cuerpo realista (manos, pies, cabeza, frente+espalda, izq/der) usando los datos SVG de `react-native-body-highlighter` (MIT) renderizados en web con `components/BodyMap2.tsx`. *Detalle a confirmar mirándolo: que la izquierda/derecha no esté espejada.*
- **Supabase**: base de datos real, auth, RLS por empresa (charlado: el plan gratis alcanza de sobra para esto).
- **Logos reales**: dejar `public/logo.png` (Safety) y `public/empresas/<slug>.png` (cada empresa) y `public/firma.png` (firma del Ing. Klopp). Mientras tanto van monogramas/firma tipográfica.
- **Notificaciones push reales** (requieren backend + claves VAPID) — el service worker ya tiene el handler `push`.
- Punto del PDF "índice de siniestralidad" que no quedó claro — confirmar con el Colo.

---

## Datos de ejemplo
- Empresas demo: Banco Comafi (cliente), Club Belgrano (prospecto), Metalúrgica Fénix, Logística del Sur — en `lib/empresas.ts`.
- Documentos y accidentes mock en `lib/mockData.ts`.
