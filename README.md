# mayraaguilera.com

Sitio oficial de **Mayra Aguilera**: libros, artículos jurídicos, muro, galería y contacto, con panel de administración.

- **Hosting:** GitHub Pages (gratis)
- **Datos, inicio de sesión, comentarios y fotos:** Firebase, plan Spark (gratis, sin tarjeta)
- **Sin compilación:** HTML, CSS y JavaScript puros. Se sube la carpeta tal cual.

---

## Qué incluye

| Sección | Público | Administradora |
|---|---|---|
| Inicio | Portada, cifras, trayectoria, libros, últimos artículos, galería | Todo se edita en **Perfil** |
| Trayectoria | Biografía, credenciales y línea de tiempo | **Perfil y trayectoria** |
| Artículos | Filtro por tema, buscador, guardar temas, me gusta, comentarios, compartir | Editor con títulos, citas, listas, enlaces e imágenes. Borradores y destacados |
| Muro | Publicaciones tipo red social con fotos, me gusta y comentarios | Publicar, fijar, ocultar, editar y eliminar |
| Galería | Mosaico por álbumes, visor a pantalla completa con zoom, flechas, deslizar en el celular y miniaturas | Subir varias fotos a la vez, poner descripciones y álbumes, eliminar |
| Libros | Catálogo 3D, detalle, comprar o pedir por WhatsApp | Precio, estado (disponible, preventa, próximamente o agotado), portada y enlace de compra |
| Contacto | Formulario, WhatsApp, correo y redes | Bandeja de **Mensajes** |
| Comentarios | Se comenta iniciando sesión con Google | Aprobar, responder y eliminar. Moderación previa opcional |

Panel: **https://mayraaguilera.com/admin.html**

---

## Paso 1: Subir el sitio a GitHub Pages

1. Creá una cuenta en https://github.com (si no tenés).
2. **New repository** → nombre: `mayraaguilera.com` → Public → Create.
3. **Add file → Upload files** → arrastrá **todo el contenido** de esta carpeta (no la carpeta en sí): `index.html`, `admin.html`, `css/`, `js/`, `assets/`, `CNAME`, `.nojekyll`, `404.html`, etc. → **Commit changes**.
   > Si `.nojekyll` no se ve al arrastrar, creá un archivo vacío con ese nombre desde **Add file → Create new file**.
4. **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main` / `(root)` → Save.
5. En la misma pantalla, en **Custom domain**, escribí `mayraaguilera.com` → Save.

## Paso 2: Apuntar el dominio (en el sitio donde lo compraste)

En la zona DNS del dominio, creá estos registros (borrá otros registros **A** de `@` si existen):

| Tipo | Nombre/Host | Valor |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | TU-USUARIO.github.io |

La propagación puede tardar desde unos minutos hasta 24 horas. Cuando GitHub detecte el dominio, activá **Enforce HTTPS** en Settings → Pages.

✅ En este punto el sitio ya se ve en mayraaguilera.com, pero en **modo demostración** (contenido de ejemplo). El siguiente paso lo conecta a una base de datos real.

---

## Paso 3: Conectar Firebase (gratis)

1. Entrá a https://console.firebase.google.com → **Agregar proyecto** → nombre `mayraaguilera` → podés desactivar Analytics → Crear.
2. **Compilación → Firestore Database → Crear base de datos** → ubicación cercana (por ejemplo `us-east1`) → **modo producción**.
3. En Firestore, pestaña **Reglas**: borrá lo que haya, pegá el contenido del archivo **`firestore.rules`** → **Publicar**.
4. **Compilación → Authentication → Comenzar** y en **Método de acceso** habilitá:
   - **Correo electrónico/contraseña** (para la administradora)
   - **Google** (para que los visitantes comenten y den "me gusta")
5. Authentication → **Configuración → Dominios autorizados** → agregá `mayraaguilera.com` y `www.mayraaguilera.com`.
6. Authentication → **Usuarios → Agregar usuario** → correo y contraseña de la doctora. **Copiá el UID** que aparece en la lista.
7. En Firestore → **Iniciar colección** → ID: `admins` → ID del documento: **pegá el UID** → agregá un campo `rol` = `admin` → Guardar.
8. ⚙️ **Configuración del proyecto → General → Tus apps → `</>` (Web)** → registrá la app → copiá los valores de `firebaseConfig`.
9. En GitHub abrí `js/config.js` → ✏️ editar → pegá los valores:

```js
export const firebaseConfig = {
  apiKey: "AIza…",
  authDomain: "mayraaguilera.firebaseapp.com",
  projectId: "mayraaguilera",
  storageBucket: "mayraaguilera.appspot.com",
  messagingSenderId: "123…",
  appId: "1:123…:web:abc…"
};
```

**Commit changes.** En un minuto el sitio queda conectado. 🎉

> La `apiKey` de Firebase **no es secreta**. Está pensada para ir en el código público. La seguridad la dan las reglas de `firestore.rules`: solo quien esté en la colección `admins` puede crear, editar o borrar contenido.

## Paso 4: Cargar el contenido real

1. Entrá a **mayraaguilera.com/admin.html** con el correo y la contraseña del paso 3.6.
2. **Perfil y trayectoria:** subí la fotografía y revisá textos, credenciales, cifras y línea de tiempo.
3. **Ajustes:** correo, WhatsApp (con +504), redes sociales y temas de los artículos.
4. **Libros**, **Galería**, **Artículos** y **Muro:** ¡a publicar!

---

## Vender los libros

El sitio no cobra directamente (eso requeriría un servidor de pagos). En cambio, cada libro ofrece:

- **Enlace de compra:** pegá un link de PayPal, Hotmart, Amazon, Gumroad o el enlace de pago de tu banco. Se convierte en el botón **"Comprar ahora"** o **"Reservar ahora"**.
- **Pedir por WhatsApp:** si configurás el número en Ajustes, aparece un botón que abre WhatsApp con un mensaje listo: *"Hola, me interesa adquirir el libro…"*.
- **Próximamente:** muestra **"Avisarme del lanzamiento"**, que lleva al formulario de contacto.

## Límites del plan gratuito (de sobra para este sitio)

- 1 GB de almacenamiento: las fotos se comprimen automáticamente en el navegador (máximo unos 600 KB cada una), así que caben **más de 1.500 fotos** además de todo el texto.
- 50.000 lecturas y 20.000 escrituras por día.
- Si algún día el sitio crece mucho, se puede pasar las imágenes a Firebase Storage (requiere el plan Blaze, de pago por uso).

## Modo demostración

Mientras `apiKey` esté vacío, el sitio usa contenido de ejemplo y el panel acepta cualquier correo y contraseña. Los cambios se guardan **solo en ese navegador**. Es útil para probar el diseño antes de conectar Firebase.

## Estructura

```
index.html        Sitio público (navegación con #/rutas)
admin.html        Panel de administración
css/styles.css    Diseño del sitio
css/admin.css     Diseño del panel
js/config.js      ← Configuración de Firebase
js/data.js        Capa de datos (demo / Firebase)
js/app.js         Vistas públicas
js/admin.js       Panel
js/ui.js          Componentes: visor de fotos, modales, íconos, compresión de imágenes
js/seed.js        Perfil por defecto y contenido de ejemplo
firestore.rules   Reglas de seguridad
CNAME             Dominio personalizado para GitHub Pages
```
