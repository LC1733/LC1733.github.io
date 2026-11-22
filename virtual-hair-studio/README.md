# Virtual Hair Studio 2.0 — OpenAI backend

Frontend público: https://lc1733.github.io/virtual-hair-studio/

## Arquitectura
- \`index.html\` (GitHub Pages): fotografía, selección de corte y color, comparación, descarga.
- \`worker.js\` (Cloudflare Workers): recibe imagen JPEG, valida entrada y llama a \`POST /v1/images/edits\` con \`gpt-image-1.5\`.
- La clave OpenAI **nunca** se coloca en HTML, GitHub Pages, ni en el repositorio.
- El frontend solo guarda la URL del backend en localStorage.
- CORS restringido a \`https://lc1733.github.io\` (no es autenticación).

## Desplegar backend
1. Crea una cuenta de Cloudflare y un Worker llamado \`virtual-hair-studio-api\`.
2. Copia \`worker.js\` en el editor del Worker y despliega, o usa Wrangler.
3. En Cloudflare > Worker > Settings > Variables and Secrets agrega:
   - **Secret**: \`OPENAI_API_KEY\` con tu clave OpenAI.
   - **Text**: \`ALLOWED_ORIGIN\` con \`https://lc1733.github.io\`.
4. Abre \`https://TU-WORKER.workers.dev/health\` y confirma \`{"ok":true,"configured":true}\`.
5. En la web abre **Conexión segura al servidor**, pega \`https://TU-WORKER.workers.dev\` (sin /generate), guarda y prueba.
6. Genera un peinado. Las imágenes se envían a OpenAI para procesarlas.

## Seguridad antes de uso público
**No habilites un endpoint de pago para visitantes anónimos sin controles adicionales.** CORS no impide llamadas directas fuera del navegador. Añade autenticación real (Cloudflare Access o login validado por backend), límites por usuario/IP con Cloudflare WAF o rate limiting, límites de presupuesto de OpenAI y monitorización. El frontend actual no integra autenticación, así que es una prueba privada/limitada, no un servicio público listo para escalar. No almacenes imágenes ni respuestas en logs.

## Limitaciones
- GitHub Pages no ejecuta el Worker: el backend debe desplegarse por separado.
- La IA puede modificar ligeramente otros rasgos pese al prompt.
- El archivo original se comprime localmente a JPEG (máximo 1536 px).
- Si el navegador o el plan API no admiten el modelo, el servidor devolverá el error para diagnóstico.
