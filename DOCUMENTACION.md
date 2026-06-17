# CarDesign · Workspace

App todo-en-uno del equipo de CarDesign.es: notas tipo Notion + tablero tipo Jira + calendario + finanzas + planner de redes + contactos + métricas. Sincronización en tiempo real entre dispositivos.

**Live:** https://alvaromuro99.github.io/CarDesign-App/

## Stack
- React 18 + Vite 5 + TypeScript
- Firebase Auth (Google, equipo autorizado) + Firestore (sincronización en tiempo real)
- GitHub Pages (base path `/CarDesign-App/`)

## Estructura del repo
```
index.html              · página desplegada (apunta a /assets/*)
assets/                 · bundle compilado (JS + CSS) + logo.png
source/                 · CÓDIGO FUENTE (para no volver a perderlo)
  package.json, vite.config.ts, tsconfig.json, index.html
  src/
    main.tsx            · arranque; limpia service workers antiguos
    App.tsx             · router de vistas + modal de búsqueda (Ctrl+K)
    Sidebar.tsx         · navegación, proyectos (reordenar ▲▼), papelera
    Dashboard.tsx       · Inicio: beneficio, anuarios vendidos, recordatorios, eventos
    Board.tsx           · tablero de tareas (drag arreglado con listeners de window)
    Editor.tsx          · editor tipo Notion (bloques, /, @, tablas, BD, PDF, export PDF)
    Calendar.tsx        · calendario (tareas + eventos con color propio)
    Finances.tsx        · movimientos con IVA + pestaña Ventas anuario
    Metrics.tsx         · métricas de redes y web (registro manual)
    Planner.tsx         · planner de contenido por estado
    Contacts.tsx        · CRM de marcas / clientes / patrocinadores
    Docs.tsx            · ayuda
    store.ts            · estado + CRUD + plantillas (pub/sub)
    firebase.ts         · auth + sincronización Firestore
    types.ts, caret.ts, useStore.ts, styles.css
DOCUMENTACION.md
```

## Compilar y desplegar
```bash
cd source
npm install
npm run build          # genera dist/
```
Sube `dist/index.html` a la raíz del repo y `dist/assets/*` a `assets/`.

## Datos
Todo el estado se guarda como un documento JSON en Firestore (`workspaces/cardesignv2`) y en caché local. Los arrays nuevos se inicializan vacíos sin tocar los datos ya guardados.

## Pendiente de API (requiere claves del usuario)
- **Google Calendar**: sincronización bidireccional de eventos (OAuth).
- **Meta / Instagram**: métricas automáticas de redes.
- **Google Analytics**: visitas de la web.
De momento eventos y métricas se registran a mano.
