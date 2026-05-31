#!/usr/bin/env node
/**
 * Générateur SEO / GEO pour abraccettoparis.com
 * ------------------------------------------------------------------
 * Source de vérité : business-data.json + pages.json
 * Sorties :
 *   - bloc managé <!-- SEO-GEO:START/END --> injecté dans chaque <head>
 *   - <title> optimisé par page
 *   - /robots.txt, /llms.txt, /sitemap.xml régénérés à la racine
 *
 * Idempotent : relancer écrase proprement le bloc managé précédent.
 * Zéro dépendance. Usage : `node tools/seo/generate.mjs`
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const SEO_DIR = __dirname;

const START = "<!-- SEO-GEO:START (généré par tools/seo/generate.mjs — ne pas éditer à la main) -->";
const END = "<!-- SEO-GEO:END -->";
const FAQ_START = "<!-- SEO-GEO-FAQ:START (généré par tools/seo/generate.mjs — ne pas éditer à la main) -->";
const FAQ_END = "<!-- SEO-GEO-FAQ:END -->";
const TODAY = new Date().toISOString().slice(0, 10);

const data = JSON.parse(readFileSync(resolve(SEO_DIR, "business-data.json"), "utf8"));
const pages = JSON.parse(readFileSync(resolve(SEO_DIR, "pages.json"), "utf8"));

const SITE = data.siteUrl.replace(/\/$/, "");
const abs = (p) => (p.startsWith("http") ? p : SITE + (p.startsWith("/") ? p : "/" + p));
const pageUrl = (file) => (file === "index.html" ? SITE + "/" : `${SITE}/${file}`);

/** Échappe pour un attribut HTML entre guillemets doubles. */
const attr = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/** Échappe pour du contenu texte HTML (pas d'attribut). */
const escText = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const OG_LOCALES = { fr: "fr_FR", en: "en_US", es: "es_ES" };

const DAY_FR = {
  Monday: "Lundi", Tuesday: "Mardi", Wednesday: "Mercredi", Thursday: "Jeudi",
  Friday: "Vendredi", Saturday: "Samedi", Sunday: "Dimanche",
};
const frDays = (days) => days.map((d) => DAY_FR[d] || d).join(", ");
const frTime = (t) => t.replace(":", "h");

// ---------------------------------------------------------------- JSON-LD
function restaurantNode() {
  const node = {
    "@type": "Restaurant",
    "@id": SITE + "/#restaurant",
    name: data.name,
    alternateName: data.alternateName,
    legalName: data.legalName,
    url: SITE + "/",
    image: abs(data.image),
    logo: abs(data.logo),
    description: data.description,
    servesCuisine: data.servesCuisine,
    priceRange: data.priceRange,
    currenciesAccepted: data.currenciesAccepted,
    paymentAccepted: data.paymentAccepted.join(", "),
    acceptsReservations: Boolean(data.acceptsReservations),
    email: data.email,
    hasMap: data.hasMap,
    hasMenu: data.menuUrl,
    sameAs: data.sameAs,
    areaServed: data.areaServed,
    address: {
      "@type": "PostalAddress",
      streetAddress: data.address.streetAddress,
      postalCode: data.address.postalCode,
      addressLocality: data.address.addressLocality,
      addressRegion: data.address.addressRegion,
      addressCountry: data.address.addressCountry,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: data.geo.latitude,
      longitude: data.geo.longitude,
    },
    parentOrganization: { "@id": SITE + "/#organization" },
    isPartOf: { "@id": SITE + "/#website" },
    openingHoursSpecification: data.openingHours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
  };
  if (data.telephone && data.telephone.trim()) node.telephone = data.telephone.trim();
  if (Array.isArray(data.amenities) && data.amenities.length) {
    node.amenityFeature = data.amenities.map((name) => ({
      "@type": "LocationFeatureSpecification",
      name,
      value: true,
    }));
  }
  if (data.acceptsReservations && data.reservationUrl) {
    node.potentialAction = {
      "@type": "ReserveAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: data.reservationUrl,
        inLanguage: data.defaultLanguage,
        actionPlatform: [
          "https://schema.org/DesktopWebPlatform",
          "https://schema.org/MobileWebPlatform",
        ],
      },
      result: { "@type": "Reservation", name: "Réserver une table" },
    };
  }
  return node;
}

function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": SITE + "/#website",
    url: SITE + "/",
    name: data.name,
    inLanguage: data.defaultLanguage,
    publisher: { "@id": SITE + "/#organization" },
  };
}

function organizationNode() {
  return {
    "@type": "Organization",
    "@id": SITE + "/#organization",
    name: data.name,
    legalName: data.legalName,
    url: SITE + "/",
    logo: { "@type": "ImageObject", url: abs(data.logo) },
    sameAs: data.sameAs,
  };
}

function breadcrumbNode(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, url], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: pageUrl(url.replace(/^\//, "")),
    })),
  };
}

function faqNode(file) {
  return {
    "@type": "FAQPage",
    "@id": pageUrl(file) + "#faq",
    mainEntityOfPage: pageUrl(file),
    mainEntity: data.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

function buildJsonLd(file, cfg) {
  const graph = [];
  for (const s of cfg.schemas || []) {
    if (s === "restaurant") graph.push(restaurantNode());
    else if (s === "website") graph.push(websiteNode());
    else if (s === "organization") graph.push(organizationNode());
    else if (s === "faq") graph.push(faqNode(file));
    else if (s === "breadcrumb" && cfg.breadcrumb) graph.push(breadcrumbNode(cfg.breadcrumb));
  }
  if (!graph.length) return null;
  return { "@context": "https://schema.org", "@graph": graph };
}

// ---------------------------------------------------------------- bloc <head>
function buildHeadBlock(file, cfg) {
  const url = pageUrl(file);
  const robots = cfg.robots || "index, follow, max-image-preview:large, max-snippet:-1";
  const ogLocale = OG_LOCALES[data.defaultLanguage] || "fr_FR";
  const lines = [];

  lines.push(`    ${START}`);
  lines.push(`    <meta name="description" content="${attr(cfg.description)}">`);
  lines.push(`    <meta name="robots" content="${attr(robots)}">`);
  lines.push(`    <link rel="canonical" href="${attr(url)}">`);
  // i18n côté client (une seule URL par page) -> x-default sur l'URL canonique
  lines.push(`    <link rel="alternate" hreflang="x-default" href="${attr(url)}">`);
  // Open Graph
  lines.push(`    <meta property="og:type" content="website">`);
  lines.push(`    <meta property="og:site_name" content="${attr(data.name)}">`);
  lines.push(`    <meta property="og:locale" content="${ogLocale}">`);
  for (const lng of data.languages) {
    const loc = OG_LOCALES[lng];
    if (loc && loc !== ogLocale) lines.push(`    <meta property="og:locale:alternate" content="${loc}">`);
  }
  lines.push(`    <meta property="og:title" content="${attr(cfg.title)}">`);
  lines.push(`    <meta property="og:description" content="${attr(cfg.description)}">`);
  lines.push(`    <meta property="og:url" content="${attr(url)}">`);
  lines.push(`    <meta property="og:image" content="${attr(abs(data.image))}">`);
  lines.push(`    <meta property="og:image:alt" content="${attr(data.name + " — restaurant italien Paris 5e")}">`);
  // Twitter
  lines.push(`    <meta name="twitter:card" content="summary_large_image">`);
  lines.push(`    <meta name="twitter:title" content="${attr(cfg.title)}">`);
  lines.push(`    <meta name="twitter:description" content="${attr(cfg.description)}">`);
  lines.push(`    <meta name="twitter:image" content="${attr(abs(data.image))}">`);
  // Géolocalisation (signaux locaux)
  lines.push(`    <meta name="geo.region" content="FR-75">`);
  lines.push(`    <meta name="geo.placename" content="Paris">`);
  lines.push(`    <meta name="geo.position" content="${data.geo.latitude};${data.geo.longitude}">`);
  lines.push(`    <meta name="ICBM" content="${data.geo.latitude}, ${data.geo.longitude}">`);
  // JSON-LD
  const jsonLd = buildJsonLd(file, cfg);
  if (jsonLd) {
    const json = JSON.stringify(jsonLd, null, 2).replace(/</g, "\\u003c");
    lines.push(`    <script type="application/ld+json">`);
    lines.push(json);
    lines.push(`    </script>`);
  }
  lines.push(`    ${END}`);
  return lines.join("\n");
}

// ---------------------------------------------------------------- FAQ visible
// Contenu FR inline (source de vérité = business-data.json) afin que le texte
// visible corresponde EXACTEMENT au JSON-LD FAQPage (exigence Google).
// Les clés data-i18n permettent la traduction EN/ES via le système existant ;
// si la clé est absente (cas du FR), le résolveur i18n laisse le texte inline.
function buildFaqHtml() {
  const items = data.faq
    .map(
      (f) => `        <details class="seo-faq__item">
          <summary class="seo-faq__q" data-i18n="Faq-q-${f.id}">${escText(f.q)}</summary>
          <div class="seo-faq__a" data-i18n="Faq-a-${f.id}">${escText(f.a)}</div>
        </details>`
    )
    .join("\n");
  return `${FAQ_START}
    <section class="seo-faq" aria-labelledby="seo-faq-title">
      <div class="container">
        <h2 id="seo-faq-title" class="seo-faq__title" data-i18n="Faq-titre">Questions fréquentes</h2>
${items}
      </div>
    </section>
    ${FAQ_END}`;
}

function injectFaq(html, file, cfg) {
  // retire un bloc FAQ managé existant (relance / désactivation)
  html = html.replace(
    new RegExp(`[ \\t]*${escapeRe(FAQ_START)}[\\s\\S]*?${escapeRe(FAQ_END)}\\n?`, "g"),
    ""
  );
  if (!(cfg.schemas || []).includes("faq")) return html;
  // Ancre : juste avant la fermeture de <main> (présente sur toutes les pages).
  if (!/<\/main>/i.test(html)) {
    console.warn(`    ⚠ ${file}: schema 'faq' déclaré mais pas de </main> — FAQ visible non injectée`);
    return html;
  }
  const block = buildFaqHtml();
  return html.replace(/([ \t]*)<\/main>/i, `${block}\n$1</main>`);
}

// ---------------------------------------------------------------- nettoyage
function stripManaged(html) {
  // 1. bloc managé existant (relance) — sûr partout, délimité par nos marqueurs
  let out = html.replace(
    new RegExp(`[ \\t]*${escapeRe(START)}[\\s\\S]*?${escapeRe(END)}\\n?`, "g"),
    ""
  );

  // 2. tags managés isolés (première migration depuis l'ancien <head>).
  //    Restreint au <head> uniquement : un JSON-LD ajouté à la main dans le
  //    <body> (ex. Menu/Event spécifique) ne doit jamais être supprimé.
  const dropPatterns = [
    /[ \t]*<meta\s+name=["']description["'][^>]*>\n?/gi,
    /[ \t]*<meta\s+name=["']keywords["'][^>]*>\n?/gi,
    /[ \t]*<meta\s+name=["']robots["'][^>]*>\n?/gi,
    /[ \t]*<meta\s+name=["']title["'][^>]*>\n?/gi,
    /[ \t]*<meta\s+name=["']geo\.[^"']*["'][^>]*>\n?/gi,
    /[ \t]*<meta\s+name=["']ICBM["'][^>]*>\n?/gi,
    /[ \t]*<meta\s+property=["']og:[^"']*["'][^>]*>\n?/gi,
    /[ \t]*<meta\s+name=["']twitter:[^"']*["'][^>]*>\n?/gi,
    /[ \t]*<link\s+rel=["']canonical["'][^>]*>\n?/gi,
    /[ \t]*<link\s+rel=["']alternate["'][^>]*hreflang[^>]*>\n?/gi,
    /[ \t]*<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\n?/gi,
  ];
  const headMatch = out.match(/<head[\s\S]*?<\/head>/i);
  if (headMatch) {
    let head = headMatch[0];
    for (const re of dropPatterns) head = head.replace(re, "");
    out = out.slice(0, headMatch.index) + head + out.slice(headMatch.index + headMatch[0].length);
  }
  return out;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ---------------------------------------------------------------- pages HTML
function processPage(file, cfg) {
  const path = resolve(ROOT, file);
  if (!existsSync(path)) return `  ⚠ ${file} introuvable, ignoré`;
  let html = readFileSync(path, "utf8");
  if (!/<\/head>/i.test(html)) return `  ⚠ ${file} sans </head>, ignoré`;

  html = stripManaged(html);

  // garde-fous longueur (troncature SERP)
  if (cfg.title && cfg.title.length > 60)
    console.warn(`    ⚠ ${file}: title ${cfg.title.length} car (>60, risque de troncature)`);
  if (cfg.description && cfg.description.length > 160)
    console.warn(`    ⚠ ${file}: description ${cfg.description.length} car (>160, risque de troncature)`);

  // titre
  if (/<title>[\s\S]*?<\/title>/i.test(html)) {
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${cfg.title}</title>`);
  } else {
    html = html.replace(/<\/head>/i, `    <title>${cfg.title}</title>\n</head>`);
  }

  // bloc managé juste avant </head>
  const block = buildHeadBlock(file, cfg);
  html = html.replace(/([ \t]*)<\/head>/i, `${block}\n$1</head>`);

  // section FAQ visible (corps) si la page déclare le schema 'faq'
  html = injectFaq(html, file, cfg);

  writeFileSync(path, html, "utf8");
  return `  ✓ ${file}`;
}

// ---------------------------------------------------------------- robots.txt
function buildRobots() {
  const aiBots = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-Web", "PerplexityBot", "Google-Extended", "Applebot-Extended", "Bingbot", "CCBot"];
  const lines = [
    "# robots.txt — A Braccetto (généré par tools/seo/generate.mjs)",
    "User-agent: *",
    "Allow: /",
    "Disallow: /assets/php/",
    "Disallow: /tools/",
    "",
    "# Crawlers IA / moteurs génératifs explicitement autorisés (visibilité GEO)",
    ...aiBots.flatMap((b) => [`User-agent: ${b}`, "Allow: /", ""]),
    `Sitemap: ${SITE}/sitemap.xml`,
    "",
  ];
  writeFileSync(resolve(ROOT, "robots.txt"), lines.join("\n"), "utf8");
  return "  ✓ robots.txt";
}

// ---------------------------------------------------------------- sitemap.xml
function buildSitemap() {
  const entries = [];
  entries.push({ loc: SITE + "/", priority: "1.0" });
  for (const [file, cfg] of Object.entries(pages)) {
    if (cfg.indexable === false) continue;
    if (file === "index.html") continue; // déjà couvert par "/"
    entries.push({ loc: pageUrl(file), priority: cfg.priority || "0.8" });
  }
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(
      (e) =>
        `  <url>\n    <loc>${e.loc}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <priority>${e.priority}</priority>\n  </url>`
    ),
    "</urlset>",
    "",
  ].join("\n");
  writeFileSync(resolve(ROOT, "sitemap.xml"), xml, "utf8");
  return "  ✓ sitemap.xml";
}

// ---------------------------------------------------------------- llms.txt
function buildLlmsTxt() {
  const hours = data.openingHours
    .map((h) => `${frDays(h.days)} : ${frTime(h.opens)}–${frTime(h.closes)}`)
    .join(" ; ");
  const a = data.address;
  const md = [
    `# ${data.name}`,
    "",
    `> ${data.description}`,
    "",
    "## Informations clés",
    "",
    `- **Nom** : ${data.name} (${data.legalName})`,
    `- **Type** : Bar, café, restaurant italien et méditerranéen`,
    `- **Adresse** : ${a.streetAddress}, ${a.postalCode} ${a.addressLocality}, France`,
    `- **Quartier** : Quartier Latin, Paris 5e — entre le Panthéon et le Jardin du Luxembourg`,
    `- **Coordonnées GPS** : ${data.geo.latitude}, ${data.geo.longitude}`,
    data.telephone && data.telephone.trim() ? `- **Téléphone** : ${data.telephone.trim()}` : null,
    `- **Email** : ${data.email}`,
    `- **Horaires** : ${hours} (service continu)`,
    `- **Cuisine** : ${data.servesCuisine.join(", ")}`,
    Array.isArray(data.amenities) && data.amenities.length
      ? `- **Services** : ${data.amenities.join(", ")}`
      : null,
    `- **Gamme de prix** : ${data.priceRange}`,
    `- **Moyens de paiement** : ${data.paymentAccepted.join(", ")}`,
    `- **Réservation** : ${data.reservationUrl}`,
    `- **Accès** : RER B Luxembourg (~100 m) ; Bus Luxembourg/Panthéon ; Métro Cluny-La Sorbonne / Odéon`,
    `- **Langues du site** : ${data.languages.join(", ")}`,
    `- **Instagram** : ${data.sameAs.join(", ")}`,
    "",
    "## Pages",
    "",
    ...Object.entries(pages)
      .filter(([, c]) => c.indexable !== false)
      .map(([file, c]) => `- [${c.title}](${pageUrl(file)}) : ${c.description}`),
    "",
    "## Questions fréquentes",
    "",
    ...data.faq.flatMap((f) => [`### ${f.q}`, "", f.a, ""]),
  ].filter((l) => l !== null);
  writeFileSync(resolve(ROOT, "llms.txt"), md.join("\n"), "utf8");
  return "  ✓ llms.txt";
}

// ---------------------------------------------------------------- run
console.log("SEO/GEO — génération depuis business-data.json + pages.json\n");
console.log("Pages HTML :");
for (const [file, cfg] of Object.entries(pages)) console.log(processPage(file, cfg));
console.log("\nFichiers racine :");
console.log(buildRobots());
console.log(buildSitemap());
console.log(buildLlmsTxt());
console.log(`\nTerminé (${TODAY}).`);
if (!data.telephone || !data.telephone.trim()) {
  console.log("\n⚠ Téléphone non renseigné dans business-data.json → omis des données structurées et de llms.txt.");
}
