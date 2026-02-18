// build.ts — Genera HTML de articulos desde Markdown
// Uso: deno run --allow-read --allow-write --allow-net build.ts

import { extract } from "jsr:@std/front-matter@1/yaml";
import { marked } from "https://esm.sh/marked@17";

// --- Tipos ---

interface Frontmatter {
  title: string;
  date: string;
  summary: string;
  tags: string[];
  draft: boolean;
}

interface ArticleEntry {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  draft: boolean;
}

// --- Rutas ---

const ROOT = new URL(".", import.meta.url).pathname;
const DRAFTS_DIR = `${ROOT}drafts`;
const ARTICLES_DIR = `${ROOT}articles`;
const DATA_DIR = `${ROOT}data`;

// --- Utilidades ---

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function formatDateSpanish(dateStr: string): string {
  const months = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  const [year, month, day] = dateStr.split("-");
  return `${parseInt(day, 10)} de ${months[parseInt(month, 10) - 1]}, ${year}`;
}

function generateSlug(filename: string, date: string): string {
  const name = filename.replace(/\.md$/, "");
  const [year, month] = date.split("-");
  return `${year}-${month}-${name}`;
}

// --- Validacion ---

function validateFrontmatter(
  attrs: Record<string, unknown>,
  filename: string,
): Frontmatter {
  const errors: string[] = [];

  if (typeof attrs.title !== "string" || !attrs.title.trim()) {
    errors.push("title es requerido");
  }
  // YAML parsea fechas como Date objects, hay que normalizar
  let dateStr = "";
  if (attrs.date instanceof Date) {
    dateStr = attrs.date.toISOString().split("T")[0];
  } else if (typeof attrs.date === "string") {
    dateStr = attrs.date;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    errors.push("date debe tener formato YYYY-MM-DD");
  }
  if (typeof attrs.summary !== "string" || !attrs.summary.trim()) {
    errors.push("summary es requerido");
  }
  if (!Array.isArray(attrs.tags)) {
    errors.push("tags debe ser un array");
  }

  if (errors.length > 0) {
    throw new Error(
      `Frontmatter invalido en ${filename}:\n  - ${errors.join("\n  - ")}`,
    );
  }

  return {
    title: attrs.title as string,
    date: dateStr,
    summary: attrs.summary as string,
    tags: (attrs.tags as string[]) || [],
    draft: typeof attrs.draft === "boolean" ? attrs.draft : false,
  };
}

// --- Template HTML ---

function buildArticleHtml(article: {
  title: string;
  date: string;
  summary: string;
  tags: string[];
  contentHtml: string;
}): string {
  const formattedDate = formatDateSpanish(article.date);
  const tagsHtml = article.tags
    .map((tag) => `            <span class="tag">${escapeHtml(tag)}</span>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(article.title)} - Jorge</title>
  <meta name="description" content="${escapeAttr(article.summary)}">
  <meta name="base-path" content="../">
  <meta property="og:title" content="${escapeAttr(article.title)}">
  <meta property="og:description" content="${escapeAttr(article.summary)}">
  <meta property="og:type" content="article">
  <link rel="stylesheet" href="../css/style.css">
  <script>
    (function() {
      var s = localStorage.getItem('theme');
      if (s) { document.documentElement.setAttribute('data-theme', s); }
      else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    })();
  </script>
</head>
<body>
  <header class="site-header">
    <div class="container">
      <a href="../index.html" class="site-logo">Jorge</a>
      <nav class="site-nav">
        <a href="../index.html">Inicio</a>
        <a href="../articles.html">Articulos</a>
        <a href="../space.html">Espacio</a>
        <button class="theme-toggle" aria-label="Cambiar tema">\uD83C\uDF19</button>
      </nav>
    </div>
  </header>

  <main>
    <div class="container">
      <article class="article-content">
        <header class="article-header">
          <time datetime="${article.date}">${formattedDate}</time>
          <h1>${escapeHtml(article.title)}</h1>
          <div class="tags">
${tagsHtml}
          </div>
        </header>

        <div class="prose">
          ${article.contentHtml}
        </div>
      </article>

      <nav class="article-nav">
        <a href="../articles.html">&larr; Volver a articulos</a>
      </nav>
    </div>
  </main>

  <footer class="site-footer">
    <div class="container">
      <p>&copy; ${new Date().getFullYear()} Jorge</p>
    </div>
  </footer>

  <script src="../js/theme.js"></script>
</body>
</html>
`;
}

// --- Main ---

async function main() {
  console.log("Construyendo articulos...\n");

  // Verificar que drafts/ existe
  try {
    await Deno.stat(DRAFTS_DIR);
  } catch {
    console.log("No se encontro el directorio drafts/. Nada que construir.");
    Deno.exit(0);
  }

  // Asegurar que existen los directorios de salida
  await Deno.mkdir(ARTICLES_DIR, { recursive: true });
  await Deno.mkdir(DATA_DIR, { recursive: true });

  // Leer archivos .md
  const mdFiles: string[] = [];
  for await (const entry of Deno.readDir(DRAFTS_DIR)) {
    if (entry.isFile && entry.name.endsWith(".md")) {
      mdFiles.push(entry.name);
    }
  }

  if (mdFiles.length === 0) {
    console.log("No se encontraron archivos .md en drafts/.");
    Deno.exit(0);
  }

  mdFiles.sort();

  // Procesar cada archivo
  const articles: ArticleEntry[] = [];
  let errorCount = 0;

  for (const filename of mdFiles) {
    try {
      const filepath = `${DRAFTS_DIR}/${filename}`;
      const raw = await Deno.readTextFile(filepath);

      const { attrs, body } = extract<Record<string, unknown>>(raw);
      const fm = validateFrontmatter(attrs, filename);
      const slug = generateSlug(filename, fm.date);
      const contentHtml = await marked.parse(body.trim());

      const pageHtml = buildArticleHtml({
        title: fm.title,
        date: fm.date,
        summary: fm.summary,
        tags: fm.tags,
        contentHtml,
      });

      const outPath = `${ARTICLES_DIR}/${slug}.html`;
      await Deno.writeTextFile(outPath, pageHtml);
      console.log(`  ${filename} -> articles/${slug}.html`);

      articles.push({
        slug,
        title: fm.title,
        date: fm.date,
        summary: fm.summary,
        tags: fm.tags,
        draft: fm.draft,
      });
    } catch (err) {
      console.error(`  ERROR en ${filename}: ${(err as Error).message}`);
      errorCount++;
    }
  }

  // Ordenar por fecha descendente
  articles.sort((a, b) => b.date.localeCompare(a.date));

  // Escribir articles.json
  const jsonPath = `${DATA_DIR}/articles.json`;
  const jsonContent = JSON.stringify({ articles }, null, 2) + "\n";
  await Deno.writeTextFile(jsonPath, jsonContent);
  console.log(`\n  data/articles.json actualizado (${articles.length} articulos)`);

  if (errorCount > 0) {
    console.error(`\n${errorCount} archivo(s) con errores.`);
    Deno.exit(1);
  }

  console.log("\nListo!");
}

main();
