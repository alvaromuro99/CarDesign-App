import React from 'react';
export default function Docs() {
  return (<div className="main"><div className="topbar"><span className="crumb">❔ Ayuda</span></div><div className="docs">
    <h1>📘 CarDesign Workspace</h1>
    <p>Todo-en-uno: notas tipo Notion + tablero tipo Jira + calendario + finanzas + planner + contactos + métricas, sincronizado entre el equipo.</p>
    <h2>Secciones</h2>
    <ul>
      <li><b>Inicio</b>: resumen (beneficio del año, anuarios vendidos, tareas, recordatorios y eventos).</li>
      <li><b>Tablero</b>: tareas en columnas. Arrastra por <code>⠿</code>; abre una tarjeta para subtareas, etiquetas, comentarios.</li>
      <li><b>Calendario</b>: tareas y <b>eventos</b> (color propio). Vista Mes / Agenda.</li>
      <li><b>Finanzas</b>: movimientos con IVA y resultado; pestaña <b>Ventas anuario</b> (unidades + publicidad).</li>
      <li><b>Métricas</b>: registro de redes y web (la conexión automática Meta/Analytics se añade con sus APIs).</li>
      <li><b>Planner redes</b>: contenido por estado (Idea→Publicado).</li>
      <li><b>Contactos</b>: CRM de marcas/clientes/patrocinadores.</li>
      <li><b>Proyectos</b>: cada uno con su Notion. Reordénalos con ▲▼. Exporta una página a PDF desde sus herramientas.</li>
    </ul>
    <h2>Editor</h2>
    <ul>
      <li><code>/</code> menú de bloques · <code>@</code> enlazar página · Markdown (<code>#</code>, <code>-</code>, <code>[]</code>, <code>&gt;</code>, <code>```</code>).</li>
      <li>Texto: selecciona para negrita/cursiva/enlace o <code>Ctrl+B/I/U</code>.</li>
      <li>Bloques: tabla, base de datos (tabla/tablero/galería), imagen, <b>PDF</b>, código, callout…</li>
      <li><b>Plantillas</b> en “Nueva página”: coche, artículo, entrevista, reunión, evento, tareas.</li>
    </ul>
    <h2>Datos</h2>
    <ul><li>Sesión Google (equipo autorizado) y sincronización en tiempo real (Firebase).</li><li>Funciona en móvil; “Añadir a pantalla de inicio”.</li></ul>
  </div></div>);
}
