# Hub "Mente & Decisión" · guía de instalación y retrofit

Tres archivos, un repositorio nuevo, cero dependencias.

## 1. Instalar el hub en la raíz de la cuenta

1. Crear el repo **`LC1733.github.io`** (exactamente ese nombre; hoy no existe). GitHub lo sirve en `https://lc1733.github.io/`.
2. Subir a la raíz: `index.html`, `catalog.json`, `relaciones.json`.
3. Settings › Pages › Deploy from a branch › `main` / `(root)`.
4. Todas las apps siguen en sus repos; el hub las carga por `/<repo>/` (mismo origen, sin CORS).

Probar en local: `python -m http.server` en la carpeta y abrir `http://localhost:8000/`. Abierto como `file://` el navegador bloquea la lectura del catálogo (el hub lo avisa en pantalla).

## 2. Cómo funciona el catálogo (nivel B)

- `catalog.json` central describe cada app: `id`, `repo`, `type`, `themes`, `status`, `deeplink`, `sections[]` (con `id`, `title`, `keywords`, y `tab` para los atlas).
- Al cargar, el hub intenta leer además `/<repo>/catalog.json`. Si existe, **sobrescribe** la entrada central. Así cada app puede mantener sus propias secciones y palabras clave sin tocar el hub.
- `relaciones.json` guarda los cruces editoriales `app#seccion → app#seccion` con un `kind` y una frase. Se muestran como chips en la barra del visor y son navegables.
- El estado del hub vive en el hash: `/#app=sesgos&sec=quiz-section` o `/#q=cortisol`. Se puede compartir.

Añadir una app nueva = una entrada en `catalog.json` (y opcionalmente edges en `relaciones.json`). No hay que tocar `index.html`.

## 3. Retrofit por app (para que los saltos a sección funcionen)

Estado hoy: solo **Jung** acepta salto directo (`#mandala`, `#tipos`, …). El hub marca las demás como "pendiente" y las abre al inicio hasta aplicar lo siguiente.

### 3.1 sesgos-decision — el cargador no reenvía el hash
`document.write` descarta el fragmento de URL. En `index.html` (el cargador), tras `document.close();` añadir:

```js
const h = location.hash.slice(1);
if (h) requestAnimationFrame(() => document.getElementById(decodeURIComponent(h))?.scrollIntoView({ behavior: 'smooth' }));
```

Con eso funcionan `#flow-svg`, `#quiz-section`, `#phases`, `#extra-grid`, que ya existen en la app. Si más adelante se quiere enlazar a un sesgo concreto ("Anclaje"), basta añadir `id` a cada tarjeta al renderizar (`id="sesgo-anclaje"`). Cambiar `deeplink` a `"hash"` en el catálogo.

### 3.2 agencia-humana — las secciones no tienen `id`
Añadir `id` a las cinco `<section class="section reveal">` en orden: `s00`, `s01`, `s02`, `s03`, `s04`. Cambiar `deeplink` a `"hash"`. De paso, eliminar la línea inválida `--r: transition: 0.25s ease;` y el `var(--r);` suelto dentro de `.dark-toggle` (el navegador los ignora, pero ensucian el CSS).

### 3.3 TDAH · TEA · BIPO (molde "Atlas Clínico v2")

**a) Bug de mismo origen.** Las tres guardan `localStorage.setItem('lastTab', …)` con la misma clave; al vivir bajo `lc1733.github.io` se pisan entre sí (abrir "síntomas" en TEA hace que TDAH y BIPO se abran en "síntomas"). Prefijar en cada app:

```js
const LS_KEY = 'tdah:lastTab';   // 'tea:lastTab', 'bipo:lastTab'
try { lastTab = localStorage.getItem(LS_KEY) || 'causas'; } catch(e) {}
…
try { localStorage.setItem(LS_KEY, tabId); } catch(e) {}
```

**b) Salto a pestaña por URL.** El hub abre `/TDAH/?tab=sintomas`. En el arranque, antes de activar `lastTab`:

```js
const qtab = new URLSearchParams(location.search).get('tab');
if (qtab && document.getElementById('tab-' + qtab)) lastTab = qtab;
```

Cambiar `deeplink` a `"tab-query"` en el catálogo (el hub ya construye `?tab=`).

**c) Lista de clases buscables repetida tres veces** (`.brain-item,.cause-item,.sym-item,…`). Definir una sola constante `const SEARCHABLE = '.brain-item,.cause-item,.sym-item,.treat-card,.card,.neuro-item,.criteria-item';` y usarla en `doSearch` y `clearSearch`. Cuando se agregue una clase nueva, se cambia en un solo lugar.

### 3.4 Neurophysiology Control Lab — publicar
Crear repo `neurofisiologia-control-lab` con `index.html` = `Neurofisiologia_Control_Lab_v1.1.html`. Cambiar `status` a `"publicada"` en el catálogo. La sección `#science` ya tiene `id`; añadir `id="app"` al `<div class="wrap">`… ya lo tiene, así que `#app` también funciona.

## 4. Tema claro/oscuro
El hub es oscuro por decisión de diseño y no impone tema a las apps; cada una conserva el suyo dentro del iframe. Si más adelante se quiere sincronizar, el hub puede enviar `frame.contentWindow.postMessage({type:'hub-theme', dark:true}, location.origin)` y cada app escuchar `message`. Mismo origen, sin restricciones.

## 5. Pendientes editoriales
- Palabras clave de los tres atlas están escritas desde el título de las pestañas, no desde el contenido real. Al publicar el `catalog.json` propio de cada atlas conviene extraerlas del texto (criterios DSM, fármacos, regiones cerebrales que realmente aparecen).
- `relaciones.json` trae 15 cruces iniciales; revisar los que unen clínica con decisión (TDAH/BIPO ↔ sesgos) porque son los más delicados de formular.
