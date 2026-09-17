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

## Arquitectura (Refactorizada)
El proyecto usa una arquitectura por capas para evitar el acoplamiento y mejorar la mantenibilidad:
- **`src/types/` & `src/constants/`**: Tipos compartidos e interfaces, y variables globales (nombres de días, colores del theme).
- **`src/components/ui/`**: Componentes visuales genéricos y reutilizables (`Modal`, `ConfirmModal`).
- **`src/services/`**: Encapsulan la lógica de acceso a datos de Dexie (`sesionService`, `historialService`, `creatinaService`). Las páginas **no** importan `db` para escribir.
- **`src/hooks/`**: Custom hooks (`useSesionActiva`, `useEstadisticas`) que extraen la lógica reactiva compleja fuera de los componentes de vista.
- **`src/pages/`**: Capa de vista; delgada, se encarga del renderizado y orquestar llamadas a hooks/services.

## Deploy
GitHub → **Vercel** (auto-deploy on push, framework preset: Vite). Tunneling con `cloudflared` solo para dev/testing local en iOS.

## Diseño
**Neumorfismo claro** custom. Fondo base `#e0e5ec`. Clases utilitarias en `index.css`: `.neu-raised`, `.neu-inset`, `.neu-button`, `.neu-active` (sombras dobles: `#b8bcc2` oscura + `#ffffff` clara). Tipografía **Poppins** (Google Fonts).

## Modelo de datos (Dexie v3)

```ts
Rutina         { id, nombre, dia, grupoMuscular, creadaEn }
Ejercicio      { id, rutinaId, nombre, setsObjetivo, repsObjetivo: string, notas, orden }
EjercicioSesion{ id, sesionId, ejercicioBaseId?, ...campos de Ejercicio }  // override por sesión
Sesion         { id, rutinaId, fecha, completada, personalizada }
SetRegistrado  { id, sesionId, ejercicioId, numeroSet, peso, reps, completado }
RegistroCreatina { id, fecha: string (YYYY-MM-DD), tomada: boolean } // [NUEVO]
```

`repsObjetivo` es string para soportar rangos (`"8-10"`, `"12 (por lado)"`). Peso siempre se persiste en **kg** (conversión Lb↔Kg solo en UI).

## Estructura de rutas
```
/                       → Inicio (auto-detecta día, redirige a rutina o descanso)
/rutinas                → Lista de rutinas
/rutina/:id             → Detalle + botón editar
/rutina/:id/editar?modo=permanente|sesion
/historial              → Lista agrupada de sesiones pasadas con cards expandibles y previews de fuerza
/estadisticas           → Racha, semana actual, progresión por ejercicio (volumen en Recharts)
/creatina               → Seguimiento mensual de suplementación
---- (Fuera del Layout con Nav Inferior) ----
/sesion/:rutinaId?sesionId=X  → Sesión activa (oculta Nav, usa state/sessionStorage, previene salida accidental)
```

## Features clave implementadas
- **Sesión Activa con Cache**: La sesión se ejecuta en memoria y `sessionStorage`. Solo persiste en la BD atómicamente cuando el usuario da click a "Finalizar" (evitando datos basura u huérfanos).
- **Protección de Salida**: `popstate` + `beforeunload` para prevenir que el usuario pierda su entrenamiento en curso por swipe back o refresh, con modal neumórfico.
- **Auto-redirect** a rutina del día actual (`Date.getDay()` mapeado a nombre día). Pantalla de "Día de descanso" los findes.
- **Edición dual**: permanente (muta DB base) vs. sesión (crea `EjercicioSesion` temporales, la rutina base queda intacta).
- **Weight picker tipo scroll** (`PesoScroll.tsx`) con snap CSS, rango según grupo muscular. Toggle Kg/Lb en UI.
- **Auto-fill reps**: al marcar un set como completado sin tocar los reps, toma el límite superior del objetivo.
- **Historial Completo**: Sesiones completadas ordenadas. Cada tarjeta muestra un preview rápido (peso máximo por los 4 primeros ejercicios). Tocar despliega todos los sets; botón de borrado atómico (borra sesión + sets).
- **Manejo de Basura**: Proceso en `useEffect` que limpia sesiones huérfanas (>24 horas incompletas).
- **Creatina Tracker**: Calendario dinámico para seguimiento mensual, racha de días consecutivos y % de cumplimiento.

## Seed
`src/db/seed.ts` con rutina PPL split de 5 días. Se carga bajo demanda con guard de duplicados (`db.rutinas.count()`).

## PWA config (relevante en iOS)
- `apple-mobile-web-app-capable: yes`
- `viewport-fit=cover` + `env(safe-area-inset-*)` en body
- Storage: IndexedDB (persiste offline; iOS puede purgar tras ~7 semanas de inactividad)

## Pendientes / mejoras evidentes
1. **Export/import JSON** de datos (crítico para iOS por posible purga del storage de IndexedDB).
2. **Historial de sets por ejercicio** para pre-fill inteligente (que el set sugiera la última carga usada en la sesión anterior en lugar de 0).
3. **Timers de descanso** entre sets con notificaciones/vibración.
4. **1RM estimado** (fórmula Epley/Brzycki) en estadísticas.
5. **Drag-and-drop** real en el editor de rutinas (react-beautiful-dnd o dnd-kit) para reemplazar los botones ↑↓.
6. **Backup automático** vía WebDAV, Google Drive, o descarga periódica de file.
7. **Sin manejo de errores global** — usar Error Boundaries para evitar pantallas blancas.

## Contexto del usuario
Usuario: estudiante de Ing. Sistemas en Ecuador, iPhone 12, prefiere respuestas breves y directas, código en español para nombres de dominio (rutinas, ejercicios, etc.), UI en español. App es de uso 100% personal.