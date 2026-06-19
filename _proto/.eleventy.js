import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const i18nDir = path.resolve(__dirname, "../assets/i18n");

const dictionaries = {
  fr: JSON.parse(fs.readFileSync(path.join(i18nDir, "fr.json"), "utf8")),
  en: JSON.parse(fs.readFileSync(path.join(i18nDir, "en.json"), "utf8")),
  es: JSON.parse(fs.readFileSync(path.join(i18nDir, "es.json"), "utf8")),
};

function lookup(dict, key) {
  return key.split(".").reduce((obj, k) => (obj == null ? undefined : obj[k]), dict);
}

function translate(key, lang) {
  const value = lookup(dictionaries[lang] ?? {}, key);
  return value === undefined ? null : value;
}

function langFromUrl(url) {
  if (!url) return "fr";
  if (url.startsWith("/en/")) return "en";
  if (url.startsWith("/es/")) return "es";
  return "fr";
}

// Match tag with paired data-i18n + data-i18n-attr (any order), or data-i18n alone.
const I18N_TAG_RE = /<(\w+)\b([^>]*?\sdata-i18n="[^"]+"[^>]*?)>([\s\S]*?)<\/\1\s*>/g;

function quoteAttr(v) {
  return String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function cookI18n(html, lang) {
  let out = html.replace(I18N_TAG_RE, (match, tag, attrs, inner) => {
    const keysM = attrs.match(/\sdata-i18n="([^"]+)"/);
    if (!keysM) return match;
    const keys = keysM[1].split(/\s+/).filter(Boolean);
    const attrsM = attrs.match(/\sdata-i18n-attr="([^"]+)"/);
    const targets = attrsM ? attrsM[1].split(/\s+/).filter(Boolean) : ["innerHTML"];

    let newAttrs = attrs;
    let newInner = inner;
    const setAttrs = {};

    for (let i = 0; i < targets.length; i++) {
      const k = keys[i];
      if (!k) continue;
      const v = translate(k, lang);
      if (v == null) continue;
      if (targets[i] === "innerHTML") newInner = v;
      else setAttrs[targets[i]] = v;
    }

    for (const [att, val] of Object.entries(setAttrs)) {
      const re = new RegExp("\\s" + att + '="[^"]*"');
      if (re.test(newAttrs)) newAttrs = newAttrs.replace(re, ' ' + att + '="' + quoteAttr(val) + '"');
      else newAttrs += ' ' + att + '="' + quoteAttr(val) + '"';
    }

    return `<${tag}${newAttrs}>${newInner}</${tag}>`;
  });

  out = out.replace(/\s+data-i18n="[^"]*"/g, "");
  out = out.replace(/\s+data-i18n-attr="[^"]*"/g, "");

  return out;
}

export default function (eleventyConfig) {
  // En mode déploiement, le build écrit à la racine du repo où `assets/` existe déjà —
  // pas besoin de le recopier (et ce serait copier sur lui-même).
  if (process.env.ELEVENTY_DEPLOY !== "1") {
    eleventyConfig.addPassthroughCopy({ "../assets": "assets" });
  }

  eleventyConfig.addGlobalData("site", {
    url: "https://abraccettoparis.com",
    defaultLang: "fr",
    languages: ["fr", "en", "es"],
  });

  eleventyConfig.addGlobalData("i18n", dictionaries);

  eleventyConfig.addFilter("t", function (key, lang) {
    const v = translate(key, lang);
    return v === null ? key : v;
  });

  eleventyConfig.addTransform("i18n-cook", function (content) {
    if (!this.page?.outputPath?.endsWith(".html")) return content;
    const lang = langFromUrl(this.page.url);
    return cookI18n(content, lang);
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    templateFormats: ["njk", "html", "md"],
    htmlTemplateEngine: "njk",
  };
}
