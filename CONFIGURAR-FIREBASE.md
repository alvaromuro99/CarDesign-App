# CarDesign Workspace · Guía de configuración

La app está en la carpeta **`CarDesign-App/`** dividida en:

- `index.html` — la página principal
- `css/` — estilos
- `js/` — el código por módulos (`data`, `projects`, `ideas`, `render`, `cloud`, `app`)
- `data/` — **el contenido / los datos**, en archivos separados:
  - `data/proyectos/` → un archivo `.json` por proyecto
  - `data/ideas/` → un archivo `.json` por idea
  - `data/index.json` → lista de qué archivos cargar (añade aquí los nuevos)
- `assets/` — el logo
- `manifest.webmanifest` + `service-worker.js` — para instalarla como app en el móvil (PWA)

> **Importante:** esta versión modular debe abrirse **servida** (publicada en internet o con un servidor local), no con doble clic. Es lo que permite cargar los datos por archivo, sincronizar entre 2 personas y las notificaciones.

---

## Modo 1 — Probarla ya en tu ordenador (sin nube)

1. Abre una terminal dentro de `CarDesign-App/`.
2. Ejecuta:  `python -m http.server 8000`
3. En el navegador entra en  `http://localhost:8000`

Funciona solo en ese equipo (datos en el navegador). Para compartir entre 2 y recibir avisos, sigue el Modo 2.

---

## Modo 2 — Compartir entre 2 personas + notificaciones (Firebase)

### A) Crear el proyecto Firebase (gratis)

1. Entra en https://console.firebase.google.com y pulsa **Crear un proyecto** (por ej. "cardesign-workspace"). Puedes desactivar Analytics.
2. Dentro del proyecto, icono **</> (Web)** para registrar una app web. Ponle un nombre y **Registrar app**.
3. Te mostrará un objeto `firebaseConfig` con `apiKey`, `authDomain`, etc. **Déjalo a mano.**

### B) Activar el inicio de sesión con Google

1. Menú **Compilación → Authentication → Comenzar**.
2. Pestaña **Sign-in method → Google → Habilitar**, elige tu correo de soporte y **Guardar**.

### C) Crear la base de datos

1. Menú **Compilación → Firestore Database → Crear base de datos**.
2. Empieza en **modo de producción**, elige región (europe-west).
3. Pestaña **Reglas** y pega esto (solo dejan entrar a vuestros 2 correos):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /workspaces/{doc} {
      allow read, write: if request.auth != null
        && request.auth.token.email in [
          'revistacardesign@gmail.com',
          'CORREO-DE-ALFON@gmail.com'
        ];
    }
  }
}
```

Cambia el segundo correo por el real y pulsa **Publicar**.

### D) Pegar la configuración en la app

1. Abre `CarDesign-App/js/cloud.js`.
2. Rellena `FIREBASE_CONFIG` con los valores de tu `firebaseConfig` (paso A3).
3. En `ALLOWED_EMAILS` añade el correo de Alfon:
   `const ALLOWED_EMAILS=["revistacardesign@gmail.com","correo-de-alfon@gmail.com"];`

### E) Publicar la app (GitHub Pages)

Como ya trabajas con el repo de GitHub:

1. Sube la carpeta `CarDesign-App/` al repositorio.
2. En GitHub: **Settings → Pages → Build from a branch**, rama `main`, carpeta `/root` (o donde esté).
3. En unos minutos tendrás una URL tipo `https://tu-usuario.github.io/...`.
4. En Firebase → **Authentication → Settings → Authorized domains** añade ese dominio `github.io`.

(Alternativas igual de válidas y gratis: Netlify o Firebase Hosting.)

### F) Usarla en el móvil + notificaciones

1. Abre la URL en el móvil (Chrome/Safari) e **inicia sesión con Google**.
2. Menú del navegador → **Añadir a pantalla de inicio** (se instala como app).
3. Acepta el permiso de **notificaciones** cuando lo pida.
4. Cuando la otra persona haga un cambio, recibirás un aviso y la app se actualizará sola en tiempo real.

---

## Sobre las notificaciones (lo que conviene saber)

- Con esta configuración recibes el aviso cuando la app está **abierta o en segundo plano** en el móvil (PWA instalada). Es gratis y no necesita nada más.
- Las notificaciones **con la app totalmente cerrada** (push "de verdad") requieren un paso extra: Firebase Cloud Messaging + una pequeña función que se dispare al cambiar el dato (plan Blaze de Firebase, que tiene cuota gratuita pero pide tarjeta). Si lo quieres, te lo monto como fase 2.

---

## Sobre los datos por archivo

- El contenido vive en `data/proyectos/*.json` y `data/ideas/*.json`: fácil de versionar en Git y de leer.
- Para **añadir** un proyecto o idea nuevo a mano: crea su `.json` y añádelo a `data/index.json`.
- La edición en vivo dentro de la app se guarda en el navegador y, con Firebase activo, en la nube compartida. El botón **💾 Guardar BD** descarga una copia completa en un único `.json`.
