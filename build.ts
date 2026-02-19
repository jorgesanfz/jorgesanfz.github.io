// build.ts — Genera JSON de articulos desde Markdown + feed RSS
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
  blocks: ArticleBlock[];
}

type ArticleBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "blockquote"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "code"; language: string; code: string }
  | { type: "image"; src: string; alt: string; title?: string }
  | { type: "hr" };

// --- Rutas ---

const ROOT = new URL(".", import.meta.url).pathname;
const ARTICLES_MD_DIR = `${ROOT}articles`;
const DATA_DIR = `${ROOT}data`;

// --- Utilidades ---

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function generateSlug(filename: string): string {
  const name = filename.replace(/\.md$/, "");
  return name;
}

function normalizeInline(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function markdownToBlocks(markdown: string): ArticleBlock[] {
  const tokens = marked.lexer(markdown);
  const blocks: ArticleBlock[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case "heading": {
        blocks.push({
          type: "heading",
          level: token.depth,
          text: normalizeInline(token.text || ""),
        });
        break;
      }

      case "paragraph": {
        blocks.push({
          type: "paragraph",
          text: normalizeInline(token.text || ""),
        });
        break;
      }

      case "blockquote": {
        const text = token.tokens
          .map((inner: any) => (inner.type === "paragraph" || inner.type === "text") ? (inner.text || "") : "")
          .join(" ");
        blocks.push({ type: "blockquote", text: normalizeInline(text) });
        break;
      }

      case "list": {
        const items = token.items.map((item: any) => normalizeInline(item.text || "")).filter(Boolean);
        blocks.push({
          type: "list",
          ordered: !!token.ordered,
          items,
        });
        break;
      }

      case "code": {
        blocks.push({
          type: "code",
          language: (token.lang || "").trim(),
          code: token.text || "",
        });
        break;
      }

      case "image": {
        blocks.push({
          type: "image",
          src: token.href || "",
          alt: token.text || "",
          title: token.title || undefined,
        });
        break;
      }

      case "hr": {
        blocks.push({ type: "hr" });
        break;
      }
    }
  }

  return blocks;
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

// --- RSS ---

function buildRssFeed(articles: ArticleEntry[]): string {
  const siteUrl = "https://jorgesanfz.github.io";
  const published = articles.filter((a) => !a.draft);
  const items = published
    .map((a) => {
      const link = `${siteUrl}/article.html?slug=${encodeURIComponent(a.slug)}`;
      const pubDate = new Date(a.date + "T12:00:00Z").toUTCString();
      return `    <item>
      <title>${escapeHtml(a.title)}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeHtml(a.summary)}</description>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Jorge</title>
    <link>${siteUrl}</link>
    <description>Espacio personal de Jorge. Desarrollo web, ideas y experimentos.</description>
    <language>es</language>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
}

// --- Main ---

async function main() {
  console.log("Construyendo articulos...\n");

  try {
    await Deno.stat(ARTICLES_MD_DIR);
  } catch {
    console.log("No se encontro el directorio articles/. Nada que construir.");
    Deno.exit(0);
  }

  await Deno.mkdir(DATA_DIR, { recursive: true });

  const mdFiles: string[] = [];
  for await (const entry of Deno.readDir(ARTICLES_MD_DIR)) {
    if (entry.isFile && entry.name.endsWith(".md")) {
      mdFiles.push(entry.name);
    }
  }

  if (mdFiles.length === 0) {
    console.log("No se encontraron archivos .md en articles/.");
    Deno.exit(0);
  }

  mdFiles.sort();

  const articles: ArticleEntry[] = [];
  let errorCount = 0;

  for (const filename of mdFiles) {
    try {
      const filepath = `${ARTICLES_MD_DIR}/${filename}`;
      const raw = await Deno.readTextFile(filepath);

      const { attrs, body } = extract<Record<string, unknown>>(raw);
      const fm = validateFrontmatter(attrs, filename);
      const slug = generateSlug(filename);
      const blocks = markdownToBlocks(body.trim());
      console.log(`  ${filename} -> slug:${slug} (${blocks.length} bloques)`);

      articles.push({
        slug,
        title: fm.title,
        date: fm.date,
        summary: fm.summary,
        tags: fm.tags,
        draft: fm.draft,
        blocks,
      });
    } catch (err) {
      console.error(`  ERROR en ${filename}: ${(err as Error).message}`);
      errorCount++;
    }
  }

  articles.sort((a, b) => b.date.localeCompare(a.date));

  const jsonPath = `${DATA_DIR}/articles.json`;
  const jsonContent = JSON.stringify({ articles }, null, 2) + "\n";
  await Deno.writeTextFile(jsonPath, jsonContent);
  console.log(`\n  data/articles.json actualizado (${articles.length} articulos)`);

  const rssContent = buildRssFeed(articles);
  await Deno.writeTextFile(`${ROOT}feed.xml`, rssContent);
  console.log(`  feed.xml generado`);

  if (errorCount > 0) {
    console.error(`\n${errorCount} archivo(s) con errores.`);
    Deno.exit(1);
  }

  console.log("\nListo!");
}

main();
