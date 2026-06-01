# Roadmap SEO / GEO — A Braccetto

Document de reprise. État du chantier SEO (référencement Google) et GEO
(Generative Engine Optimization : ChatGPT, Perplexity, Google AI Overviews) du
site `abraccettoparis.com` — site **statique HTML**, multi-pages, sans backend.

Dernière mise à jour : 2026-06-01.

---

## ✅ Fait (committé sur la branche `feat/seo-geo-management`)

Branche basée sur **`prod`** (et non `master`, qui est un « first commit »
obsolète, ~122 commits de retard). Poussée sur `origin`.

Système centralisé dans **`tools/seo/`** :

| Fichier | Rôle |
|---|---|
| `business-data.json` | Source de vérité : NAP, horaires, GPS, FAQ, amenities, réservation |
| `pages.json` | title / description / schemas / priorité par page |
| `generate.mjs` | Générateur Node idempotent, **zéro dépendance** |
| `keywords.md` | Mots-clés concurrentiels (analyse Paris 5e/6e) |
| `README.md` | Guide de maintenance |
| `ROADMAP.md` | Ce document |

Commande : `node tools/seo/generate.mjs`

Livré sur les 12 pages :
- `<title>` / meta description optimisés (mots-clés concurrentiels)
- canonical, robots, Open Graph (+ `og:image:alt`), Twitter Card, `geo.*` / `ICBM`
- JSON-LD : Restaurant (graphe relié), WebSite, Organization, BreadcrumbList, FAQPage
- `amenityFeature` (terrasse, cocktails, végétarien, réservation, PMR)
- **FAQ visible** : 12 Q/R en accordéon, traduites FR/EN/ES, **identiques au
  JSON-LD** (exigence Google : le contenu d'un FAQPage doit être visible)
- Pages légales en `noindex`

À la racine : `robots.txt` (autorise les crawlers IA : GPTBot, ClaudeBot,
PerplexityBot, Google-Extended, CCBot…), `sitemap.xml`, `llms.txt`.

Données alignées sur la **fiche Google Business** : téléphone
`01 42 01 01 07`, réservation **OpenTable**, services.

Skill réutilisable : `.claude/skills/seo-geo-restaurant/`.

### Décisions arbitrées
- **Pas d'AggregateRating** : les ~1500 avis sont la propriété de Google
  (affichés sur la fiche) ; les baliser sur le site sans les y collecter
  violerait les règles Google (risque d'action manuelle).
- **Réservation = OpenTable** (confirmé par la fiche Google).
- **Horaires après minuit** (`closes` 02:00 < `opens`) : c'est la forme
  **canonique correcte** de Schema.org — ne PAS découper en deux plages.

---

## ⏳ À faire côté exploitant (hors code)

- [ ] **Créer la PR** : base = `prod`, head = `feat/seo-geo-management`.
      (`gh` n'était pas authentifié ; à faire à la main.)
      → https://github.com/jerign/abraccetto/compare/prod...feat/seo-geo-management
- [ ] **Restreindre la clé API Google Maps** exposée en clair dans le HTML
      (Google Cloud Console : referrer + API Maps JS uniquement + alertes
      facturation). Finding préexistant, hors périmètre SEO.
- [ ] Post-déploiement : valider sur
      [Rich Results Test](https://search.google.com/test/rich-results) +
      soumettre `sitemap.xml` dans la Search Console.
- [ ] Affiner les **coordonnées GPS** (48.8465, 2.3417 = approximées).

---

## 🚧 Chantier EN PAUSE — Multilingue SEO (le gros gain restant)

### Problème
Le site est traduit **EN / ES uniquement côté client en JavaScript**, avec
**une seule URL par page** (`/menu.html` sert les 3 langues via `data-i18n`).
Conséquences (confirmées par recherche 2025-2026) :
- Google n'indexe en pratique que la **version française**.
- Les crawlers IA (ChatGPT, Perplexity, Gemini, Claude) **n'exécutent pas le
  JS** → ils ne voient que le français.
- `hreflang` est impossible sans URLs distinctes (seul `x-default` est posé).

→ Un touriste qui cherche « italian restaurant near Pantheon Paris » ou
« restaurante italiano barrio latino » ne trouve quasiment pas le site.

### Solution retenue (validée sur le principe)
Passer en **« source DRY → sortie statique »** : générer au *build-time*
(pas au runtime). On garde 100 % le déploiement statique.

```
src/
  data/        business-data.json, pages.json, i18n/{fr,en,es}.json   ← UNE source
  partials/    head.html, nav.html, footer.html, faq.html             ← édités 1 fois
  pages/       index.html, menu.html, …  (seulement le <main> propre)  ← édités 1 fois
build.mjs      assemble partials + contenu + traductions
─────────────────────────────────────────────────────────────────────
SORTIE (déployée, statique, jamais éditée à la main) :
  index.html, menu.html, …            (FR)
  en/index.html, en/menu.html, …      (EN)   ← traduction CUITE dans le HTML
  es/index.html, es/menu.html, …      (ES)   ← lisible sans JS, indexable
```

Le build, pour chaque (page × langue) : injecte head/nav/footer communs,
**remplace les `data-i18n` par le vrai texte traduit**, pose le `hreflang`
réciproque + `x-default`, le bon `lang=`, et le JSON-LD avec `inLanguage` et
titres/metas traduits (mots-clés EN/ES touristes).

**Déploiement inchangé** : `node build.mjs` en local → commit du HTML généré →
push. Aucun serveur, aucune CI requise. Le `<select>` de langue cesse de faire
du swap JS et pointe vers `/en/…` `/es/…` (plus propre et indexable).

### Pourquoi ça résout AUSSI la redondance
Aujourd'hui nav/footer/head sont dupliqués et **édités à la main dans 12
fichiers**. Avec cette approche, ils sont écrits **une seule fois** (partials)
et propagés au build. La duplication ne subsiste que dans la **sortie générée,
jamais éditée**. C'est le fonctionnement standard d'Eleventy / Hugo / Astro :
HTML statique en sortie, code factorisé en entrée.

### Coût réel
- **Migration unique** : découper les 12 pages en `partials communs` +
  `contenu propre`. ~70 % de l'effort. Risque de régression visuelle à
  contrôler en **comparant le rendu généré au site actuel, page par page**.
- Ce build **remplace** `generate.mjs` (qui injectait dans des pages éditées à
  la main) — plus propre, supprime la fragilité du `stripManaged`.
- **Prérequis contenu** : compléter les traductions EN/ES de **tout le texte
  visible** (aujourd'hui seuls nav/footer/quelques sections sont traduits ; le
  corps des pages, peu).

### Décisions encore ouvertes (à trancher à la reprise)
1. **Moteur de build** :
   - Build maison **zéro-dépendance** (recommandé — garde le stack ultra-simple,
     prolonge l'approche actuelle de `generate.mjs`), ou
   - **Eleventy (11ty)** SSG standard (meilleure ergonomie long terme, mais
     ajoute Node/npm + un toolchain).
2. **Périmètre de migration** :
   - **Prototype 1 page d'abord** (recommandé — migrer `index.html`, valider le
     rendu identique, puis dérouler les 11 autres), ou
   - tout migrer d'un coup, ou
   - juste figer le plan et finaliser d'abord la PR SEO/GEO actuelle.

### Mots-clés cibles EN / ES (pour la reprise)
- EN : `italian restaurant near pantheon paris`, `best italian restaurant latin
  quarter paris`, `authentic italian restaurant paris`, `pizza restaurant paris
  5th`, `romantic dinner paris pantheon`, `english speaking italian restaurant
  paris`.
- ES : `restaurante italiano paris pantheon`, `restaurante italiano barrio
  latino paris`, `auténtico restaurante italiano paris`, `pizzería paris
  pantheon`, `cena romántica paris pantheon`, `dónde comer en paris pantheon`.

---

## Note GEO (nuance importante)
Plusieurs sources 2025 (dont Google) indiquent que **`llms.txt` n'est lu par
aucun moteur génératif aujourd'hui**. Il est conservé (coût nul, utile si ça
évolue), mais le vrai levier GEO reste le **HTML structuré et lisible sans JS**
(JSON-LD + FAQ visible) — ce qui est en place. Le multilingue ci-dessus
renforcera directement la GEO en langues étrangères.
