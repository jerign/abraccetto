#!/usr/bin/env node
// Migration d'une page HTML existante vers le pipeline 11ty multilingue.
// Usage: node tools/migrate-page.mjs <page>.html
// Crée :
//   src/_includes/layout-<page>.njk      ← layout spécifique à la page
//   src/<page>.njk                       ← version FR (frontmatter)
//   src/en/<page>.njk                    ← version EN
//   src/es/<page>.njk                    ← version ES
// Le contenu est transformé : assets/ → /assets/, lang variable, includes nav/faq, SEO multilingue.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");
const srcDir = path.resolve(__dirname, "../src");
const includesDir = path.join(srcDir, "_includes");

const pageFile = process.argv[2];
if (!pageFile) {
  console.error("Usage: node tools/migrate-page.mjs <page>.html");
  process.exit(1);
}

const pageName = pageFile.replace(/\.html$/, "");
const sourcePath = path.join(projectRoot, pageFile);

if (!fs.existsSync(sourcePath)) {
  console.error(`Page introuvable : ${sourcePath}`);
  process.exit(1);
}

let html = fs.readFileSync(sourcePath, "utf8");

// 1) lang variable
html = html.replace(/<html lang="[^"]*">/, '<html lang="{{ lang }}">');

// 2) chemins relatifs assets/ → /assets/
html = html.replace(/="assets\//g, '="/assets/');
html = html.replace(/\(assets\//g, "(/assets/");

// 3) remplacer la nav existante par un include
const navRe = /<div class="znav-container[^"]*"[^>]*id="topnav"[^>]*>[\s\S]*?<\/nav>\s*<\/div>/;
html = html.replace(navRe, '{% include "nav.njk" %}');

// 4) variabilisation du head SEO si présent (canonical, og, twitter, hreflang)
html = html.replace(/<title>[^<]*<\/title>/, "<title>{{ title }}</title>");
html = html.replace(
  /<link rel="canonical" href="[^"]*">/,
  '<link rel="canonical" href="{{ site.url }}{{ canonicalPath }}">'
);
html = html.replace(
  /<meta name="description" content="[^"]*">/,
  '<meta name="description" content="{{ description }}">'
);
html = html.replace(/<meta property="og:locale" content="[^"]*">/, '<meta property="og:locale" content="{{ ogLocale }}">');
html = html.replace(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="{{ title }}">');
html = html.replace(/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="{{ description }}">');
html = html.replace(/<meta property="og:url" content="[^"]*">/, '<meta property="og:url" content="{{ site.url }}{{ canonicalPath }}">');
html = html.replace(/<meta name="twitter:title" content="[^"]*">/, '<meta name="twitter:title" content="{{ title }}">');
html = html.replace(/<meta name="twitter:description" content="[^"]*">/, '<meta name="twitter:description" content="{{ description }}">');

// 5) JSON-LD inLanguage variable
html = html.replace(/"inLanguage":\s*"fr"/g, '"inLanguage": "{{ lang }}"');

// 6) hreflang : remplacer le bloc existant par le bloc complet réciproque
const oldHreflang = /<link rel="alternate" hreflang="x-default"[^>]*>(?:\s*<link rel="alternate"[^>]*>)*/;
const newHreflang = [
  '<link rel="alternate" hreflang="x-default" href="{{ site.url }}{{ canonicalPath | replace("/" + lang, "") if lang != "fr" else canonicalPath }}">',
  '<link rel="alternate" hreflang="fr" href="{{ site.url }}/' + (pageName === "index" ? "" : pageName + ".html") + '">',
  '<link rel="alternate" hreflang="en" href="{{ site.url }}/en/' + (pageName === "index" ? "" : pageName + ".html") + '">',
  '<link rel="alternate" hreflang="es" href="{{ site.url }}/es/' + (pageName === "index" ? "" : pageName + ".html") + '">',
].join("\n    ");
if (oldHreflang.test(html)) {
  html = html.replace(oldHreflang, newHreflang);
}

// 7) écrire le layout
const layoutPath = path.join(includesDir, `layout-${pageName}.njk`);
fs.writeFileSync(layoutPath, html);

// 8) générer les 3 frontmatter files (FR/EN/ES)
const pagePath = pageName === "index" ? "/" : `/${pageName}.html`;
const titles = { fr: `${pageName} — A Braccetto`, en: `${pageName} — A Braccetto`, es: `${pageName} — A Braccetto` };

function frontmatter(lang, canonicalPath, permalink) {
  const ogLocale = { fr: "fr_FR", en: "en_US", es: "es_ES" }[lang];
  return `---
layout: layout-${pageName}.njk
permalink: ${permalink}
lang: ${lang}
canonicalPath: ${canonicalPath}
ogLocale: ${ogLocale}
title: "${titles[lang]}"
description: "À compléter pour ${pageName} en ${lang.toUpperCase()}"
ogImage: /assets/images/main-header-1.jpg
ogImageAlt: "A Braccetto"
---
`;
}

fs.writeFileSync(path.join(srcDir, `${pageName}.njk`), frontmatter("fr", pagePath, pagePath));

const enDir = path.join(srcDir, "en");
const esDir = path.join(srcDir, "es");
fs.mkdirSync(enDir, { recursive: true });
fs.mkdirSync(esDir, { recursive: true });
fs.writeFileSync(path.join(enDir, `${pageName}.njk`), frontmatter("en", `/en${pagePath}`, `/en${pagePath}`));
fs.writeFileSync(path.join(esDir, `${pageName}.njk`), frontmatter("es", `/es${pagePath}`, `/es${pagePath}`));

console.log(`✓ Migrée : ${pageName}`);
console.log(`  → ${path.relative(projectRoot, layoutPath)}`);
console.log(`  → src/${pageName}.njk, src/en/${pageName}.njk, src/es/${pageName}.njk`);
console.log(`  → À compléter à la main : title/description par langue dans les 3 frontmatter`);
