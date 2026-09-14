# Gym Tracker — Resumen técnico

**Tipo:** PWA instalable (mobile-first, iPhone) para tracking personal de rutinas de gimnasio.

## Stack
- **Vite 8 + React 18 + TypeScript** (template `react-ts`, linter: Oxlint)
- **Tailwind CSS v4** (`@tailwindcss/vite`, sin `tailwind.config.js`, config vía `@theme` en CSS)
- **React Router v6** (BrowserRouter, rutas anidadas con `<Outlet />`)
- **Dexie.js + dexie-react-hooks** (IndexedDB wrapper, `useLiveQuery` para reactividad)
- **Recharts** (gráficas de progresión)
- **lucide-react** (iconografía)
- **vite-plugin-pwa** (service worker + manifest, `registerType: 'autoUpdate'`)

## Deploy
GitHub → **Vercel** (auto-deploy on push, framework preset: Vite). Tunneling con `cloudflared` solo para dev/testing local en iOS.

## Diseño
**Neumorfismo claro** custom. Fondo base `#e0e5ec`. Clases utilitarias en `index.css`: `.neu-raised`, `.neu-inset`, `.neu-button`, `.neu-active` (sombras dobles: `#b8bcc2` oscura + `#ffffff` clara). Tipografía **Poppins** (Google Fonts). Sin librería de componentes.

## Modelo de datos (Dexie v2)

```ts
Rutina         { id, nombre, dia, grupoMuscular, creadaEn }
Ejercicio      { id, rutinaId, nombre, setsObjetivo, repsObjetivo: string, notas, orden }
EjercicioSesion{ id, sesionId, ejercicioBaseId?, ...campos de Ejercicio }  // override por sesión
Sesion         { id, rutinaId, fecha, completada, personalizada }
SetRegistrado  { id, sesionId, ejercicioId, numeroSet, peso, reps, completado }
```

`repsObjetivo` es string para soportar rangos (`"8-10"`, `"12 (por lado)"`). Peso siempre se persiste en **kg** (conversión Lb↔Kg solo en UI).

## Estructura de rutas
```
/                       → Inicio (auto-detecta día, redirige a rutina de hoy o descanso)
/rutinas                → Lista de rutinas
/rutina/:id             → Detalle + botón editar
/rutina/:id/editar?modo=permanente|sesion
/sesion/:rutinaId?sesionId=X  → Sesión activa (X presente = personalizada)
/historial              → [pendiente de implementar UI]
/estadisticas           → Racha, semana actual, progresión por ejercicio (volumen)
```

## Features clave implementadas
- **Auto-redirect** a rutina del día actual (`Date.getDay()` mapeado a nombre día)
- **Fines de semana** → pantalla "Día de descanso"
- **Edición dual**: permanente (muta DB base) vs. sesión (crea `EjercicioSesion` temporales, la rutina base queda intacta)
- **Reordenar ejercicios** con botones ↑↓ (no drag-and-drop)
- **Weight picker tipo scroll** (`PesoScroll.tsx`) con snap CSS, rango según grupo muscular:
  - Tronco superior: 0-150 kg, saltos de 2
  - Piernas: 0-300 kg, saltos de 5
  - Toggle Kg/Lb en UI, persiste en kg (`KG_TO_LB = 2.20462`)
- **Reps picker scroll** parte del máximo del rango objetivo (parseado con regex `\d+`)
- **Auto-fill reps** al marcar set completado sin haber tocado reps (usa el máximo del objetivo)
- **Stats**: racha (ignora sáb/dom), total de días, semana actual visual con círculos, gráfica de línea Recharts con volumen (peso × reps) agrupado por sesión, con selector de ejercicio en modal

## Seed
`src/db/seed.ts` con rutina PPL split de 5 días (Lun: Pecho/Tríceps, Mar: Cuádriceps, Mié: Espalda/Bíceps, Jue: Glúteo/Femoral, Vie: Hombro/Brazos). Se carga bajo demanda con guard de duplicados (`db.rutinas.count()`).

## PWA config (relevante en iOS)
- `apple-mobile-web-app-capable: yes`
- `viewport-fit=cover` + `env(safe-area-inset-*)` en body
- Íconos: 192x192, 512x512 (+ maskable), apple-touch-icon 180x180
- Storage: IndexedDB (persiste offline; iOS puede purgar tras ~7 semanas de inactividad)

## Pendientes / mejoras evidentes
1. **Pantalla `/historial`** placeholder — falta implementar listado de sesiones + drill-down
2. **Export/import JSON** de datos (crítico para iOS por posible purga del storage)
3. **`SesionActiva`** no filtra por ejercicios de sesión al leer `setsRegistrados` — `ejercicioId` puede colisionar entre tablas `ejercicios` y `ejerciciosSesion` (mismo autoincrement independiente)
4. **Historial de sets por ejercicio** para pre-fill inteligente (última carga usada)
5. **Timers de descanso** entre sets
6. **1RM estimado** (fórmula Epley/Brzycki)
7. **Drag-and-drop** real en editor (react-beautiful-dnd o dnd-kit)
8. **Backup automático** vía File System Access API o descarga periódica
9. **Sin tests** — añadir Vitest + React Testing Library
10. **Sin manejo de errores global** — usar Error Boundaries

## Contexto del usuario
Usuario: estudiante de Ing. Sistemas en Ecuador, iPhone 12, prefiere respuestas breves y directas, código en español para nombres de dominio (rutinas, ejercicios, etc.), UI en español. App es de uso 100% personal.