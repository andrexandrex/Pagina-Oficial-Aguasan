# AguaSan Perú — sitio web (contexto interno / historial técnico)

Sitio oficial de AguaSan, ONG de agua y saneamiento para comunidades peruanas. Este archivo es la memoria técnica del proyecto — no es el README público (ver `README.md` para eso).

## Arquitectura

- **Frontend:** sitio estático Jekyll (tema Agency/Bootstrap), publicado en **GitHub Pages** bajo el dominio personalizado `aguasanperu.org` (DNS en GoDaddy, apuntando a GitHub Pages).
- **Formulario de contacto:** sin backend propio. `_includes/contact.html` hace `fetch()` directo desde el navegador a [Web3Forms](https://web3forms.com/) (access key ya configurada en el HTML — es pública por diseño, enruta el envío, no es una credencial). Lógica en `js/contact-api.js`.
- **Newsletter:** formulario embebido de **Brevo** (ex-Sendinblue) en `_includes/contact.html`, POST directo al form action de Brevo con `mode: "no-cors"` (evita el problema de página en blanco por redirect). Deduplicación de envíos vía `localStorage` (`nl_subscribed`) para no re-enviar confirmación al mismo correo dos veces desde el mismo navegador — la solución definitiva contra duplicados es configurar en Brevo "si el contacto ya existe → actualizar" en vez de re-confirmar.
- **Bot de WhatsApp:** Cloudflare Worker en `whatsapp-worker/` (webhook verify + respuestas por palabra clave). Scaffold completo, **aún no desplegado** — falta que el usuario cree cuenta Cloudflare + app Meta WhatsApp Business y corra `wrangler secret put` + `wrangler deploy`.

GitHub Pages no ejecuta PHP ni Python — por eso el formulario y el bot están diseñados para no necesitar servidor propio.

## ⚠️ Importante: cómo se despliega el sitio en vivo

**GitHub Pages sirve desde la rama `gh-pages`, NO desde `main`.** Esto es fácil de olvidar y ya causó confusión: se hicieron varios pushes a `main` que nunca llegaron al sitio en vivo porque Pages nunca mira esa rama.

Flujo correcto para publicar cambios:
```
git checkout main            # o la rama de trabajo actual
# ... hacer cambios, commit ...
git push origin <rama>:main  # mantiene main como historial de trabajo

# Para que el cambio se vea en aguasanperu.org:
git fetch origin gh-pages
git branch gh-pages-local origin/gh-pages
git checkout gh-pages-local
git merge <rama-con-los-cambios>
git push origin gh-pages-local:gh-pages
git checkout <rama-de-trabajo>
git branch -d gh-pages-local
```
Verificar el build con: `gh api repos/andrexandrex/Pagina-Oficial-Aguasan/pages/builds/latest` (status debe llegar a `"built"`).

`gh-pages` no tiene contenido propio — históricamente solo recibe merges de `main` vía PR manual, así que fusionar es seguro (verificar con `git diff origin/gh-pages <último-commit-mergeado> --stat` antes de asumirlo).

## Repo: público, y por qué eso está bien

El repo (`github.com/andrexandrex/Pagina-Oficial-Aguasan`) es público. GitHub Pages en el plan Free **no soporta repos privados** (requiere GitHub Pro o superior). Se decidió mantenerlo público porque los valores "sensibles" del código (access key de Web3Forms, URL del form de Brevo) **no son secretos reales** — se ejecutan en el navegador del visitante y son visibles vía "Ver código fuente" sin importar la visibilidad del repo. La protección real contra mal uso es restringir el dominio permitido desde los dashboards de Web3Forms/Brevo, no ocultar el repo.

Los secretos que sí son reales (tokens de WhatsApp/Meta) ya están correctamente fuera del repo: se configuran con `wrangler secret put` y `.dev.vars` está en `.gitignore`.

## Estructura del repositorio

```
_includes/        Componentes HTML (header, footer, services, contact, portfolio_grid, etc.)
_layouts/         default (home), proyectos, historia, page (legal/estático), style.css
_posts/           Proyectos/entradas del portafolio (FBA, FLAI, Crisis, Impacto, Purús, Lurigancho...)
_data/            template.yml (colores, fuentes, redes sociales)
js/               JS del sitio, incluye contact-api.js (contacto + newsletter)
css/, img/        Estilos e imágenes
whatsapp-worker/  Cloudflare Worker del bot de WhatsApp (deploy independiente, no lo builda Jekyll)
```

### Páginas del sitio

- `/` — home (`_layouts/default.html`): hero, Sobre Nosotros (Impacto destacado + Crisis compacta), Nuestros Productos (FBA/FLAI), sección "Conoce Más de AguaSan" (Proyectos + Historia lado a lado), Ayuda, Contacto.
- `/proyectos/` — grid completo de proyectos (modales por post).
- `/historia/` — timeline completo (spine timeline), reutiliza `_includes/about.html`.
- `/politica-de-privacidad/` y `/terminos-y-condiciones/` — páginas legales (`_layouts/page.html`), enlazadas desde el footer.

## Desarrollo local

### Sitio (Jekyll)
```
bundle install
bundle exec jekyll serve
```
`http://localhost:4000`

### Bot de WhatsApp (Cloudflare Worker)
```
cd whatsapp-worker
npm install
cp .dev.vars.example .dev.vars   # completar con valores reales
npm run dev
```

## Notas y gotchas conocidos

- **Colisión de clases CSS vía modales:** Jekyll inyecta el `content` de *todos* los posts (incluyendo cualquier `<style>` que tengan) en cada página, vía `modals.html`. Si un post define una clase CSS que también se usa fuera del modal (p. ej. `.crisis-card`), el CSS del post gana por orden de aparición y rompe el estilo fuera del modal. Ya pasó una vez con `.crisis-card` (post `2023-02-23-crisis.html` vs. el teaser en `services.html`) — se resolvió prefijando las clases del teaser como `.ct-crisis-*`. Al añadir nuevas clases "genéricas" fuera de un post, revisar que ningún post use el mismo nombre.
- `_site/` está commiteado en el repo (hábito heredado, no es necesario para GitHub Pages — el build legacy de Pages regenera todo desde el código fuente igual). Se mantiene por consistencia con el historial existente, no se ha limpiado.
- `_config.yml` excluye `whatsapp-worker/`, `Gemfile`, `Gemfile.lock`, `README.md` del build de Jekyll.

## Roadmap / próximas mejoras

- **Desplegar el bot de WhatsApp:** crear cuenta Cloudflare + app Meta WhatsApp Business, correr `wrangler secret put` (3 secretos) y `wrangler deploy`, registrar el webhook en Meta.
- **Respuestas con IA (Stage 2 del bot):** reemplazar el matching por palabra clave con `env.AI` de Workers AI (`@cf/meta/llama-3-8b-instruct`).
- **Duplicados de newsletter:** configurar en Brevo "si el contacto ya existe → actualizar" en vez de re-enviar confirmación de doble opt-in.
- **Corregir enlace de WhatsApp en `_config.yml`:** está anidado en la lista `social` de una persona con `title: stack-overflow` en vez de ser un link `whatsapp` de nivel superior.
- **Dominio personalizado para el Worker:** opcionalmente `wa.aguasanperu.org` en vez de `*.workers.dev`.
- **Registro de envíos del formulario:** respaldo de cada envío (ej. Google Sheets) más allá del correo.
- **Analítica:** Plausible o Google Analytics.
- **Restringir dominio en Web3Forms/Brevo:** activar la opción de dominio permitido en ambos dashboards como mitigación real contra reuso de las keys públicas.

## Créditos

Basado en el tema [Agency](https://startbootstrap.com/template-overviews/agency/) de Start Bootstrap, adaptado para [Jekyll](https://github.com/y7kim/agency-jekyll-theme).
