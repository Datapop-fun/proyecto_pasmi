# PASMI POS Next

Reescritura del POS PASMI en Next.js (App Router) con React + TypeScript, estado centralizado y CSS Modules, tomando como referencia el prototipo de `index.html`.

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript.
- CSS Modules (tokens en `app/globals.css`).
- Icons: `lucide-react`. Gráficas: `chart.js` + `react-chartjs-2`. Confetti: `canvas-confetti`.

## Estructura
- `src/app/(pos)/`: rutas protegidas `vender`, `inventario`, `informes`, `ajustes`.
- `src/components/`: UI reusable (nav, grid, carrito, modal pago, inventario CRUD, informes).
- `src/state/`: contextos para auth local, productos, carrito, pedidos, ajustes y toasts.
- `src/lib/`: tipos, constantes y cliente API hacia Apps Script/Cloudinary.

## Variables de entorno
Copiar `.env.example` a `.env.local` y completar:
```
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_CLOUDINARY_URL=
NEXT_PUBLIC_CLOUDINARY_PRESET=
```

## Scripts
- `npm run dev` — entorno local.
- `npm run lint` — linting.
- `npm run build` — build de producción.

## Flujo de autenticación
Login local (credenciales prototipo: `PASMI` / `PASMI`) con persistencia en `localStorage`. La ruta raíz muestra el panel de login y luego redirige a `/vender`.

## Estado del proyecto
- Vender: categorías, grid de productos, carrito, modal de pago con cálculo de vueltas y registro de ventas/pedidos pendientes.
- Inventario: formulario y lista CRUD con subida opcional a Cloudinary.
- Informes: dashboard con métricas, top productos, tendencias y donut de pagos.
- Ajustes: base, egresos, metas y stock de café con UI renovada.

## Desarrollo
1) Instala dependencias: `npm install`
2) Define variables en `.env.local`
3) Corre `npm run dev` y abre `http://localhost:3000`
