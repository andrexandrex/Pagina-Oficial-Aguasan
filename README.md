# AguaSan Perú — sitio web

Sitio oficial de AguaSan, organización dedicada a agua y saneamiento para comunidades peruanas. **Agua para todos los peruanos.**

## Arquitectura

- **Frontend:** sitio estático generado con [Jekyll](https://jekyllrb.com/) (tema Agency/Bootstrap), publicado en **GitHub Pages** bajo el dominio personalizado `aguasanperu.org` (comprado en GoDaddy, DNS apuntando a GitHub Pages).
- **Formulario de contacto:** sin backend propio. El formulario en [`_includes/contact.html`](_includes/contact.html) hace un `fetch()` directo desde el navegador a [Web3Forms](https://web3forms.com/), que reenvía el mensaje por correo. La lógica de envío vive en [`js/contact-api.js`](js/contact-api.js).
- **Bot de WhatsApp:** un [Cloudflare Worker](https://workers.cloudflare.com/) (`whatsapp-worker/`) recibe los webhooks de la API de WhatsApp Business (Meta) y responde automáticamente según palabras clave. Corre en el edge, sin servidor que mantener.

GitHub Pages **no ejecuta PHP ni Python** — por eso ambas piezas dinámicas (formulario y bot) están diseñadas para no necesitar un servidor propio.

## Estructura del repositorio

```
_includes/        Componentes HTML (header, footer, contact, etc.)
_layouts/         Layouts de Jekyll
_posts/           Proyectos/entradas del portafolio
_data/            Datos (template.yml)
js/               JavaScript del sitio (incluye contact-api.js)
css/, img/        Estilos e imágenes
whatsapp-worker/  Cloudflare Worker del bot de WhatsApp (código separado, deploy independiente)
```

## Desarrollo local

### Sitio (Jekyll)
```
bundle install
bundle exec jekyll serve
```
Abrir `http://localhost:4000`.

### Bot de WhatsApp (Cloudflare Worker)
```
cd whatsapp-worker
npm install
cp .dev.vars.example .dev.vars   # completar con valores reales
npm run dev
```

## Configuración del formulario de contacto (Web3Forms)

1. Crear cuenta gratuita en [web3forms.com](https://web3forms.com/) y obtener un *Access Key*.
2. En [`_includes/contact.html`](_includes/contact.html), reemplazar `YOUR_WEB3FORMS_ACCESS_KEY` por la clave real.
3. El campo oculto `botcheck` es el honeypot anti-spam que Web3Forms reconoce automáticamente — no remover.
4. No se necesita ningún secreto del lado del servidor para esta parte: la *access key* de Web3Forms está pensada para ir en el HTML público (enruta el envío, no es una credencial de autenticación).

## Configuración del bot de WhatsApp (Cloudflare Worker + Meta)

Pasos manuales (fuera de este repo):

1. Crear una cuenta en [Cloudflare](https://dash.cloudflare.com/sign-up).
2. Crear una app en [Meta for Developers](https://developers.facebook.com/), agregar el producto **WhatsApp**, y obtener un número de teléfono de prueba (o de producción) y un *access token* permanente.
3. Definir los secretos del Worker (no se commitean):
   ```
   cd whatsapp-worker
   npx wrangler secret put WHATSAPP_ACCESS_TOKEN
   npx wrangler secret put WHATSAPP_PHONE_NUMBER_ID
   npx wrangler secret put WHATSAPP_VERIFY_TOKEN
   ```
4. Desplegar: `npm run deploy` (dentro de `whatsapp-worker/`). Esto da una URL `https://aguasan-whatsapp-worker.<tu-subdominio>.workers.dev`.
5. En el dashboard de Meta, registrar como webhook: `https://.../api/whatsapp/webhook`, usando el mismo valor de `WHATSAPP_VERIFY_TOKEN` para la verificación.
6. Enviar un mensaje de WhatsApp al número configurado y confirmar que llega una respuesta automática.

## API del Worker

`GET /api/whatsapp/webhook` — verificación de Meta (devuelve `hub.challenge` si el token coincide).

`POST /api/whatsapp/webhook` — recibe mensajes entrantes, responde según palabra clave (horario, ubicación, donar, proyectos, contacto) o con un mensaje genérico si no hay coincidencia.

## Roadmap / próximas mejoras

- **Respuestas con IA (Stage 2 del bot de WhatsApp):** reemplazar el matching por palabra clave con un *binding* `env.AI` de Cloudflare Workers AI (`@cf/meta/llama-3-8b-instruct`), usando una base de conocimiento curada sobre AguaSan para respuestas dinámicas sin alucinaciones.
- **Newsletter real:** completar la integración de Mailchimp en `_includes/contact.html` (reemplazar `YOUR_MAILCHIMP_ACTION_URL` y el campo honeypot `b_XXXX_XXXX` con los valores reales del formulario embebido).
- **Corregir enlace de WhatsApp:** en `_config.yml`, el enlace `https://wa.me/51958961259` está anidado dentro de la lista `social` de una persona con `title: stack-overflow` — debería moverse a la lista `social` de nivel superior con el título correcto (`whatsapp`).
- **Dominio personalizado para el Worker:** opcionalmente, registrar algo como `wa.aguasanperu.org` en lugar del subdominio `*.workers.dev`.
- **Registro de envíos:** guardar copia de cada envío del formulario de contacto (por ejemplo, en una hoja de Google Sheets) para tener respaldo más allá del correo.
- **Analítica:** agregar [Plausible](https://plausible.io/) o Google Analytics para medir visitas.

## Créditos

Basado en el tema [Agency](https://startbootstrap.com/template-overviews/agency/) de Start Bootstrap, adaptado para [Jekyll](https://github.com/y7kim/agency-jekyll-theme).
