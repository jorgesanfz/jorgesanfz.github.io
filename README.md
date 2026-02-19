# Web personal de Jorge

Sitio estático con contenido gestionado en **Markdown** y renderizado en cliente.

## Cómo funciona

El flujo de artículos es:

1. Escribes artículos en `articles/*.md`.
2. Ejecutas el build con Deno (`build.ts`).
3. El build genera `data/articles.json` (con metadatos + bloques de contenido).
4. El cliente renderiza:
   - listado en `articles.html` (`js/articles.js`)
   - detalle en `article.html?slug=...` (`js/article.js`)

## Estructura relevante

- `articles/` → fuente en Markdown
- `build.ts` → convierte Markdown a JSON y actualiza RSS
- `data/articles.json` → base de datos estática de artículos
- `articles.html` + `js/articles.js` → listado
- `article.html` + `js/article.js` → página de detalle
- `feed.xml` → RSS generado por build

## Formato de un artículo Markdown

Cada archivo en `articles/` debe tener frontmatter YAML:

```md
---
title: Título del artículo
date: 2026-02-19
summary: Resumen corto para listados y RSS.
tags: [tag1, tag2]
draft: false
---

Contenido en Markdown...
```

### Tipos de contenido soportados

El build transforma Markdown a bloques JSON con estos tipos:

- `paragraph`
- `heading`
- `blockquote`
- `list`
- `code`
- `image`
- `hr`

## Comandos

### Generar JSON + RSS

```bash
deno run --allow-read --allow-write --allow-net build.ts
```

### Servir en local

```bash
python3 -m http.server 8001
```

Abrir:

- `http://localhost:8001/articles.html`
- `http://localhost:8001/article.html?slug=bienvenidos`

## Publicar un artículo nuevo

1. Crear `articles/mi-articulo.md` con frontmatter válido.
2. Ejecutar build.
3. Verificar listado y detalle en local.
4. Commit + push.

## Notas

- El `slug` se deriva del nombre del archivo Markdown (sin `.md`).
- Si `draft: true`, no se muestra en listado ni RSS.
- El RSS usa URLs del formato `article.html?slug=...`.
