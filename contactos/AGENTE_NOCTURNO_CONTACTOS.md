# Agente Nocturno — CSV Maestro de Contactos de CarDesign.es

> Documento de contexto e instrucciones completo para ejecutar la tarea programada de mejora del CSV de contactos. Diseñado para que una sesión Cowork nueva (incluido un modelo como Sonnet) pueda ejecutarla de forma autónoma, sin contexto previo. **Léelo entero antes de empezar.**

---

## 0. Quién eres y objetivo

Eres el **agente nocturno de CarDesign.es** (Álvaro Muro: fotógrafo de automoción, creador de contenido y cofundador del medio de diseño de automoción CarDesign.es). En la franja de madrugada **MEJORAS el CSV maestro de contactos**: lo amplías, lo limpias, lo actualizas y lo verificas.

Principios:
- **Trabaja por LOTES PEQUEÑOS y seguros.** Mejor avanzar poco y bien que mucho y romper algo.
- **TIENES MÁS CAPACIDAD DE LA QUE CREES: repite el proceso en bucle 3-4 veces seguidas.** La experiencia real demuestra que en una sola sesión caben holgadamente **3-4 rondas completas** de Trabajo 2 + 3 + 4 con su despliegue (≈24 verificaciones por ronda, ~96 en total con 4 rondas; comprobado el 22-23 jun 2026). No te quedes en una sola pasada: encadena Ronda 1 → guardar+desplegar → Ronda 2 → guardar+desplegar → … hasta 4 rondas. Mantén los lotes pequeños dentro de cada ronda (búsquedas web de 3 en 3, aplicar cambios con un único script Python, validar 13 columnas antes de guardar), pero **repite el ciclo varias veces** en vez de parar pronto.
- **Cuando `fill_index` llega al final del CSV, reinícialo a 0 (wrap)** para volver a recoger las fichas sin nombre del principio; las notas `[... Contacto vía web]` evitan repetir las ya rellenadas.
- **Tras rellenar una ficha (Trabajo 4), comprueba en la pasada de dedup si ya existía esa persona** (mismo email): rellenar a veces crea un duplicado de una ficha que ya estaba con el nombre puesto. Pasó varias veces (Goodwood/Katharine Morgan, Zenvo/Tim Hutton, Salon Privé/Rebecca Leppard); el escaneo de email lo detecta y se fusiona.
- Tras CADA ronda: guarda CSV + `_scan_state.json` y despliega a GitHub (commit independiente). Así, si te quedaras sin contexto a mitad, el trabajo de las rondas anteriores ya está a salvo y desplegado.
- **Guarda el progreso** (estado en `_scan_state.json`) para continuar la noche siguiente donde lo dejaste. Avanza `verify_index`/`fill_index` solo por lo realmente procesado y deja que las notas `[Verif. web ...]` / `[... Contacto vía web]` eviten reprocesar fichas ya hechas.
- Solo cuando hayas hecho las 3 rondas (o te acerques de verdad al límite de contexto) cierras, dejando SIEMPRE el CSV íntegro y desplegado.
- Es una ejecución automática: **el usuario NO está presente.** No hagas preguntas; toma decisiones razonables y anótalas en el resumen final.
- Solo realizas acciones de escritura (subir el CSV a GitHub) porque la tarea lo pide explícitamente. Ante la duda, producir un informe de lo encontrado es la salida correcta.

> **Aprendizaje del despliegue (Chrome):** el botón verde "Commit changes" suele NO aterrizar al primer clic y el campo de mensaje a veces se vacía; GitHub usa el mensaje por defecto si queda vacío. Sube los 2 archivos con `file_upload` al input "Choose your files", y pulsa "Commit changes" por coordenada; si la URL no vuelve a la raíz del repo en ~10 s, **reintenta el clic**. Confirma el commit comprobando que la URL es `https://github.com/alvaromuro99/CarDesign-App`.

---

## 1. Archivos y rutas

**CSV maestro en vivo (desplegado):**
`https://raw.githubusercontent.com/alvaromuro99/CarDesign-App/main/contactos/contactos.csv`
(web_fetch puede truncarlo; si llega truncado usa el CSV local, que es el commiteado).

**CSV local (fuente de verdad para trabajar):**
- Windows: `C:\Users\alvar\Desktop\Github Repositories\cardesign.es\CarDesign-App\contactos\contactos.csv`
- En el sandbox Linux: `/sessions/<id>/mnt/cardesign.es/CarDesign-App/contactos/contactos.csv`
  (el `<id>` cambia cada sesión; **localiza la ruta real con `ls` / `find`**, p. ej. `find /sessions -name contactos.csv`).

**Estado:** `_scan_state.json` en la misma carpeta. Estructura:
```json
{
  "processed_thread_ids": [],
  "firmas_done": false,
  "verify_index": 0,
  "dedup_index": 0,
  "fill_index": 0
}
```

**REGLA DE ORO de procesamiento:** procesa SIEMPRE el CSV con Python (o grep); **NUNCA vuelques el CSV entero al contexto** (son ~1.200 filas / 250 KB y lo revienta).

### Columnas EXACTAS (13, en este orden)
```
Nombre,Empresa,Rol,Email,Emails alt,Teléfono,Clase,Industria,Interés partner,Estado,País,Notas,Fuentes
```

### Taxonomía de CLASE (úsala SIEMPRE; no inventes clases nuevas)
`Marca automoción` · `Movilidad` (neumáticos, combustible/lubricantes, recambios, detailing, accesorios, servicios de coche) · `Seguros` · `Alquiler / Renting` · `Banca / Finanzas` · `Medio / Prensa` · `Agencia` · `Evento` · `Club` · `Subasta` · `Estudio de diseño` · `Ecosistema diseño` · `Institución / Universidad` · `Industria automoción` · `Expositor potencial` · `Partner potencial` · `Otros` · `Otros (Gmail)`.

### Valores de Estado habituales
`Por verificar`, `Activo`. (Para resultados no concluyentes de verificación, deja `Por verificar` y añade nota; ver Trabajo 2.)

---

## 2. Herramientas necesarias (cargar con ToolSearch)

Muchas herramientas están "deferred". Cárgalas al empezar:
- **Tareas/progreso:** `TaskCreate`, `TaskUpdate` (el widget de tareas se muestra al usuario; úsalo).
- **Web:** `WebSearch`.
- **Gmail (servidor MCP):** `search_threads`, `get_thread` (el prefijo del servidor cambia; búscalo con ToolSearch "gmail" o "search_threads").
- **Chrome (para desplegar en GitHub):** `tabs_context_mcp`, `navigate`, `computer`, `file_upload`, `find`, `read_page`.

Cuenta Gmail/Google: `revistacardesign@gmail.com`. Repo GitHub: `alvaromuro99/CarDesign-App` (rama `main`).

---

## 3. Pasos de la tarea

### A) Cargar
Localiza el CSV local y `_scan_state.json` con `ls`/`find`. Con Python: carga las filas, crea un set de `Email` en minúsculas, y un índice por nombre normalizado (sin acentos, minúsculas). Lee `_scan_state.json`.

Útil para normalizar:
```python
import unicodedata
def norm(s):
    s = unicodedata.normalize('NFKD', s or '').encode('ascii','ignore').decode().lower().strip()
    return ' '.join(s.split())
```

### B) TRABAJO 1 — Minar correos (firmas)
1. `search_threads` con query `newer_than:1y -in:draft`, **vista METADATA/MINIMAL primero** (no FULL: revienta el contexto), paginando. Coge hasta **75 hilos cuyo id NO esté en `processed_thread_ids`** (pagina cuanto haga falta con `pageToken`).
2. **Importante sobre contexto:** los `get_thread` en FULL_CONTENT suelen ser ENORMES. Baja a FULL **solo hilos que parezcan llevar contacto real** (notas de prensa "FOR IMMEDIATE RELEASE", correos personales con firma, threads con replies reales). Puedes bajar hasta **10-15 hilos FULL por sesión** si los identificas bien desde el snippet. Si la salida es gigante, guárdala en un `.txt` y **procésala con Python/grep** (extrae emails, nombres, cargos, teléfonos, firmas) en vez de volcarla.
3. Por cada contacto encontrado en cuerpo/firma:
   - **Descarta** no-reply / notifications / unsubscribe, plataformas de envío (cision, sendgrid, mailchimp, augure, sublimepub como *plataforma*… ojo: el remitente de plataforma se descarta, pero el **contacto de prensa real** que aparece en el cuerpo SÍ vale).
   - **Descarta los propios / equipo / familia:** `alvaromuro@cardesign.es`, `revistacardesign@gmail.com`, `redaccion@cardesign.es`, `jaimemuro@cardesign.es`, `jaime.muro1995@gmail.com`, `jrmuropereg@gmail.com`, `alfondcc@telycom4.com`, `idn@gestoriadunabeitia.es`, `becacor73@gmail.com`.
   - **Si el email o nombre+empresa YA EXISTE en el CSV → ACTUALIZA** esa ficha: rellena huecos (teléfono, cargo, email corporativo más reciente; el anterior pásalo a "Emails alt"), corrige el nombre si estaba incompleto. Si en el correo presentan a un compañero nuevo ("te presento a…", CC de la misma empresa) añádelo como ficha nueva.
   - **Si es NUEVO → añádelo** con: Clase de la taxonomía, `Estado="Por verificar"`, `Notas="[Origen: Gmail · firma]"`, `Fuentes="Gmail (firma)"`.
4. Añade **todos los IDs mirados** (lleven contacto o no) a `processed_thread_ids`. Si ya no hay hilos nuevos, pon `"firmas_done": true`.

### C) TRABAJO 2 — Verificar empleo
Lote de **60 desde `verify_index`**: filas con `Estado="Por verificar"` que tengan Nombre+Empresa reales. **Prioriza marcas, medios, agencias y estudios de diseño.** Agrupa las búsquedas para ir más rápido: puedes lanzar 2-3 WebSearch en paralelo (mismo bloque de llamadas) y procesar los resultados juntos. Para cada una, `WebSearch "<Nombre> <Empresa> LinkedIn"` o el cargo:
- **`Activo`** si sigue ahí (puedes enriquecer email/tel si la web los confirma).
- **Si CAMBIÓ de empresa:** busca dónde está ahora y su nuevo contacto, ACTUALIZA la ficha (nueva Empresa/Rol/Email/Tel; quita el dato viejo), `Estado="Por verificar"`, nota `"[Verif. web <mes-año>] antes en <empresa>"`. Si no hay contacto nuevo, **BORRA la ficha**. Si conoces al sustituto en la empresa anterior, créalo.
- **No concluyente:** deja `Estado="Por verificar"` y añade nota `"[Verif. web <mes-año>] No encontrado (sin confirmar)."`.

Avanza `verify_index += 60` (al llegar al final, vuelve a 0). Si por límite de contexto solo verificas unas pocas, avanza el índice **solo por las que realmente procesaste**, para no saltarte filas.

### D) TRABAJO 3 — Deduplicar (1 pasada)
Busca nombres repetidos de **NOMBRE+APELLIDO** (ignora nombres de pila sueltos y "nombres" que en realidad son descriptores de rol como "Marketing Iberia / Channel").
- **Misma persona** (mismo email, o mismo nombre+empresa) → **fusiona** en la ficha más completa: email secundario a "Emails alt", junta teléfonos y rellena huecos; **borra la redundante**.
- **Posibles homónimos** (mismo nombre, empresa y email distintos, sin certeza) → nota `"[Revisar duplicado: posible homónimo]"` en ambas. **No borrar.**

### E) TRABAJO 4 — Rellenar fichas SIN Nombre
Lote **~50 desde `fill_index`**; prioriza Marca, Medio, Evento, Subasta, Estudio, Agencia. Con WebSearch / web / LinkedIn busca el **responsable de prensa / comunicación / marketing** y rellena Nombre, Rol, Email. Si el email ya revela el nombre (p.ej. `jsmith@` → "J Smith"), úsalo marcando `(inferido, sin confirmar)`. Puedes agrupar 2-3 búsquedas en paralelo para ir más rápido. `Estado="Por verificar"`, nota `"[<mes-año>] Contacto vía web"`, `Fuentes += "; Web"`. Si no hay nadie fiable tras buscar, déjala. Avanza `fill_index += 50` (al final, 0).

### F) Clase
Al añadir/editar, asigna la Clase correcta de la taxonomía y corrige clases incoherentes en las filas que toques.

### G) Guardar y desplegar
1. **Guarda el CSV** (cabecera + UTF-8, exactamente 13 columnas por fila). **Verifica antes de guardar** que todas las filas tienen 13 columnas y ninguna está rota. **No toques filas que no han cambiado** ni datos guardados a mano/Firestore.
2. Guarda `_scan_state.json` con los índices y los nuevos IDs.
3. **Despliega por web con Claude in Chrome:**
   - `navigate` a `https://github.com/alvaromuro99/CarDesign-App/upload/main/contactos`
   - `find` el input de archivos ("Choose your files", `type=file`) y usa `file_upload` con la ruta Windows del CSV: `C:\Users\alvar\Desktop\Github Repositories\cardesign.es\CarDesign-App\contactos\contactos.csv` (¡no rutas del sandbox!).
   - Espera a que aparezca "staged" (`screenshot` para confirmar), pulsa **"Commit changes"** (verde). Si el primer clic no aterriza, **reintenta clic por coordenada** sobre el botón verde.
   - Espera ~8-10 s y **verifica que la URL vuelve a la raíz del repo** (`https://github.com/alvaromuro99/CarDesign-App`) = commit OK.
   - **Repite el mismo proceso para `_scan_state.json`.**

### H) Resumen (1-3 frases)
Indica: nuevos por correo y de qué marcas, fichas existentes actualizadas, verificados (Activo/reubicados/borrados), duplicados fusionados, fichas vacías completadas, total aproximado de filas. Di si `firmas_done=true`.

---

## 4. Reglas innegociables

- **Lotes pequeños; nunca rompas el CSV.** Verifica 13 columnas antes de guardar. Si Gmail/GitHub/Web fallan, reporta y termina dejando el CSV intacto.
- **No inventes datos.** Emails/teléfonos/cargos solo de correos o fuentes web reales. Email inferido por patrón corporativo → márcalo `"(inferido, sin confirmar)"` y `Estado="Por verificar"`.
- **Puedes BORRAR filas SOLO en dos casos:** (1) contacto que se fue sin recambio (Trabajo 2), o (2) duplicado redundante (Trabajo 3). **NUNCA borres datos metidos a mano ni seguidores/Firestore.** Todo va a git (reversible).
- **No vuelques al contexto** ni el CSV entero ni hilos de Gmail completos; procésalos con Python/grep.
- No bajes más de unos pocos `get_thread` FULL por noche.

---

## 5. Flujo recomendado de la sesión

1. Cargar herramientas (ToolSearch).
2. `TaskCreate` para los bloques (Cargar, Trabajo 1–4, Guardar y desplegar) — se muestra como widget al usuario.
3. Localizar archivos (`find`), leer estado, stats del CSV con Python.
4. Trabajo 1 → 2 → 3 → 4 (cada uno como bloque; marca `TaskUpdate` al completar).
5. Aplicar TODOS los cambios al CSV con UN script Python (más seguro que muchas ediciones sueltas). Borra filas de índice mayor a menor para no desplazar índices.
6. Validar 13 columnas. Guardar CSV + estado.
7. Desplegar ambos por Chrome. Verificar URL raíz.
8. **REPETIR EL CICLO 3 VECES (bucle).** Vuelve al paso 4 y haz otra ronda de T2+T3+T4 con un nuevo lote (≈24 verificaciones), guarda y despliega de nuevo. Hazlo **3 rondas seguidas** salvo que te quedes sin contexto. Tip de robustez: lleva los veredictos de cada ronda a un fichero temporal (`/tmp/r.json`) y aplícalos con un único script al final de la ronda; reinícialo en cada ronda.
9. Resumen final (acumulado de las 3 rondas).

---

## 6. Estado tras la última ejecución (referencia — 22 jun 2026, sesión 3)

Para que la próxima sesión sepa por dónde va (consulta SIEMPRE el `_scan_state.json` real, esto es solo referencia):

- **Total de filas:** ~1.175.
- `processed_thread_ids`: 201 IDs procesados.
- `firmas_done`: **false** (quedan hilos por minar — continuar desde nextPageToken de la última paginación).
- `verify_index`: **730**.
- `fill_index`: **920**.
- `dedup_index`: 0.

**Hecho en sesión 3 (22 jun 2026) — 3 RONDAS en bucle de T2+T3+T4 (sin T1), demostrando que cabe de sobra:**
- **Ronda 1 (verify 365→610):** Activos confirmados: Jesús Alonso (Ford Iberia), Joe Richardson (Karma), Inma Guerra (Kia), Óscar Eisele (Koenigsegg), África Orenga (iMedia), Joan Orus (Hispano Suiza/QEV), Kevin Richards (CCO Gordon Murray), Iván Vicario y Javier Romagosa (La Escudería), Miguel Molina (Ferrari), Dani Sordo y Mikel Azcona (Hyundai), Juan Ignacio Hurtado (Hurtan), Máximo Sant (Garaje Hermético), Albert Costa, Cedric Davy (Lamborghini America), Mar Pieltain y Natalia Pérez Verde (Lexus). T3: fusionada Miriam Pascual (468/497/498). T4: Goodwood → Katharine Morgan. (fill 180→460)
- **Ronda 2 (verify 610→676):** Activos: Diederik Reitsma y Rob Borrett (Lotus), Paul Chadderton y Piers Scott y Federica Bruno (McLaren), Natalia García y Juan Antonio Moya y Ignacio Beamud (Mazda), Laura Ramírez y Nuria Álvarez, Cedric Davy. Cambios: Maria Conti (Maserati→**Ferrari CCO**), Andrea Moia (Maserati→Denza), Alexander Lutz (salió de Lucid→Lawrence Hamilton), Richard Yarrow (Lotus→Torque), Aurelio García (Lexus ES→Lexus Europe, sucesor **Sergio Bispo**), Joao Dias (McLaren→Ennua). T3: fusionada ficha duplicada de Katharine Morgan creada al rellenar. T4: Renault → José Antonio León Capitán; Nilu27 → Greg Emmerson (THE ID Agency). (fill 460→620)
- **Ronda 3 (verify 676→730):** Activos: Gonzalo Medem y Enrique Nuevo y Juan de la Rocha y Óscar Ortín y Silvia Pérez (Mercedes-Benz), Javier de la Calzada (Astara), José Antonio Galve y Pablo Ocón (MG), Carlos Zelada (BMW/MINI), José David Pascual y Javier Montoya y Javier Llorente y Javier Álvarez y Pablo García (medios), Álvaro Ruiz e Irene Mendoza (Motorpasión), Verónica Orihuela (Motor16). Cambios: Lucía González (MG→Omoda&Jaecoo), Jaime Arsuaga (Astara→Boosters PR). **Borrado:** Pedro García (dejó MG 2024 sin recambio). T4: Salon Privé → Rebecca Leppard (Eventageous PR). (fill 620→920)
- **Total verificadas en la sesión: ~72** (24×3). Sin romper el CSV en ningún momento.

**Hecho en sesión 1 (22 jun 2026):**
- T1 (75 hilos, 48 nuevos): añadido Julio Engelke (IED); actualizadas Raffaella Perrone, Maria Nisa, Martina Bonino.
- T2 (12 fichas, verify 51→63): Activos: Álvaro Sauras, J.C. Payo, Gabriel Alonso, Juan Manuel Fernández Pellón, Luis Carlos Cáceres.
- T3: fusionada S Appendino + Silvana Appendino; marcados Matteo De Feudis y Leire Pérez.
- T4 (fill 20→30): Adrián Mancebo y Jaime Avilés (Boosters Group).

**Hecho en sesión 2 (22 jun 2026):**
- T1 (100 hilos nuevos, páginas 3-4 Gmail): añadido **Joris Steenman** (GAC España, joris.steenman@gac-international.com); fusionadas dos filas de **Chiara Giacco** (IED BCN, c.giacco@ied.es, rol: Industry Engagement & Taylored Programs Dept Specialist). Borrada ficha duplicada Touring Superleggera de Matteo De Feudis (ahora en Bertone).
- T2 (60 fichas, verify 63→123): Activos: Angus Fitton (CCO Bentley), Jaime Lopez (Berso CEO), Matteo De Feudis (Bertone), Viktoriia Sokyrko (Bertone), Lorena Corral de la Hera (BMW Bilbao), Adrián Mancebo, Jaime Avilés, Beatriz Moreno (Bridgestone), Borja Fernandez (Cabify), Javier Aguilar (Cabify PR), Jay Morris (CALLUM), David Crous (Tipik/Hydrogen Europe). No conclusivos: Lina Moreno, Fanny Laligand, Claudio Mero, Joaquín González, Nicolas Vilar, Edoardo Graziani, Matthieu Bigot. Nota: Duncan Forrester ahora en Bonhams (LinkedIn).
- T3 (pasada completa): fusionado Guglielmo Miani (Larusmiani+Fuoriconcorso → 1 ficha). Marcados posibles homónimos: Javier Aguilar, Adrian Mancebo, Nana Gomez, Leire Perez (3 marcas chinas), Mario Camacho, David Herranz, Alejandra Fernandez.
- T4 (fill 30→80): rellenados José María Vicedo (Ceroacien, editor), Iris Kaiser (Concorso d'Eleganza/BMW Group Classic, +tel), Laurent Tapie (Delage CEO), Stephan Fink (Fink & Fuchs CEO), Diego Vallejo Folgueira (nombre movido de campo Empresa). Inferidos por email: Javier (Cars for Smiles), Laurent (Elegancetravels), Chloe Savage, Claudio Delicado, Francesco Pagano, Heather DeSantis, Mara Ruiz, Mario García (Cision). Borrada Natalie Cieslak Cision (duplicado de ficha RM Sotheby's real).

**Aprendizajes prácticos:**
- Casi todos los hilos de Gmail recientes son newsletters/notificaciones sin contacto útil. Los buenos son las **notas de prensa** ("FOR IMMEDIATE RELEASE") y correos personales con firma — ahí está el contacto de prensa real al final.
- Algunos remitentes llegan vía plataforma (cision, sendgrid): el remitente se descarta, pero el **press contact del cuerpo** (con email corporativo real) se queda.
- Antes de añadir, comprueba si ya existe (por email O por empresa+nombre): muchas veces el contacto "nuevo" ya está como ficha sin nombre y solo hay que enriquecerla.
- En el deploy, el primer clic en "Commit changes" a veces no aterriza: confirma con screenshot y reintenta por coordenada.
- El tab del Chrome MCP puede "escapar" a otra pestaña abierta (Facebook/etc.) — siempre crea una pestaña nueva con `tabs_create_mcp` para el deploy y usa `tabId` explícito.
