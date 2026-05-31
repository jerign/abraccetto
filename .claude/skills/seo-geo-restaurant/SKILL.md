---
name: seo-geo-restaurant
description: >
  Gère le SEO local ET le GEO (Generative Engine Optimization) d'un site de
  restaurant/commerce local. Audite l'existant, génère les données structurées
  Schema.org (Restaurant, Menu, FAQ, AggregateRating, Event…), les balises
  on-page (title/description/OG/Twitter/canonical/hreflang/geo), robots.txt,
  sitemap.xml et llms.txt, intègre une FAQ visible alignée sur le JSON-LD, et
  applique des mots-clés concurrentiels. Utiliser quand on parle de SEO, GEO,
  référencement, mots-clés, données structurées, fiche Google, visibilité IA,
  ou optimisation d'un site de restaurant.
---

# SEO + GEO pour restaurant / commerce local

Optimise un site pour **deux audiences à la fois** :

- **SEO local** : Google Search / Maps / Pack local → trafic et réservations.
- **GEO** (Generative Engine Optimization) : ChatGPT, Perplexity, Google AI
  Overviews, Claude → être **cité** comme réponse.

Les deux partagent la même fondation (données exactes, structurées, cohérentes),
mais le GEO exige en plus du **contenu factuel citable** et un accès explicite
aux crawlers IA. Ne jamais traiter l'un sans l'autre.

## Principe directeur : une source de vérité

Toutes les données business (NAP, horaires, géoloc, FAQ, réservation) vivent dans
**un seul fichier de données**. Un générateur idempotent les propage partout
(HTML, JSON-LD, sitemap, llms.txt). On n'édite jamais les balises à la main : on
édite les données et on régénère. Cela garantit la cohérence NAP, critère #1 du
SEO local et de la confiance des LLM.

Architecture de référence (cf. `tools/seo/` dans ce repo) :

```
tools/seo/
  business-data.json   source de vérité (NAP, horaires, geo, FAQ, paiements…)
  pages.json           title/description/schemas/priority par page
  generate.mjs         générateur Node idempotent (0 dépendance)
```

## Workflow

### 1. Audit
- Inventorier les pages, l'état des `<title>`/description (génériques ? dupliqués ?).
- Vérifier présence de : canonical, Open Graph, JSON-LD, robots.txt, sitemap, llms.txt.
- Extraire les **données business réelles** du site (adresse, tél, horaires, GPS,
  réservation, réseaux). **Ne jamais inventer** une donnée manquante (tél, GPS) :
  la laisser vide et l'omettre des données structurées, signaler à l'utilisateur.
- Identifier le mécanisme i18n (si traduction client-side → 1 URL/page, pas de
  hreflang multi-URL ; utiliser `x-default` sur la canonique).

### 2. SEO on-page (par page)
- `<title>` unique, ~50-60 caractères, mot-clé + ville/quartier + marque.
- `meta description` ~120-160 caractères (au-delà : tronquée en SERP — émettre un
  warning au build).
- `canonical` auto-référent, `robots` (`noindex,follow` sur pages légales).
- Open Graph complet (`og:title/description/url/image/type/site_name/locale` +
  `og:image:alt`) + Twitter Card `summary_large_image`.
- Signaux locaux : `geo.region`, `geo.placename`, `geo.position`, `ICBM`.

### 3. Données structurées Schema.org (cœur SEO **et** GEO)
Émettre un `@graph` JSON-LD cohérent (`@id` reliés) :
- **Restaurant / LocalBusiness** sur accueil + contact : `address/PostalAddress`,
  `geo/GeoCoordinates`, `openingHoursSpecification`, `servesCuisine`, `priceRange`,
  `acceptsReservations` (booléen), `paymentAccepted`, `hasMenu`, `areaServed`
  (quartiers ciblés), `sameAs`, `potentialAction/ReserveAction`.
  - Horaires après minuit : `closes` < `opens` sur le **même** jour est la forme
    **canonique correcte** (ne PAS découper en 23:59 + 00:00).
- **WebSite** + **Organization** (relier : `Restaurant.parentOrganization`,
  `isPartOf` vers `#website`, `publisher`).
- **BreadcrumbList** sur les sous-pages.
- **FAQPage** : voir règle critique ci-dessous.
- Selon les pages : **Menu**/`hasMenuSection`, **Offer** (`price`/`priceCurrency`)
  pour des formules, **Event** (`startDate`/`offers`) pour Nouvel An/soirées,
  **AggregateRating**/**Review** *uniquement si avis réels et vérifiables*
  (jamais d'avis inventés — risque de pénalité + perte de confiance LLM).

### 4. GEO — visibilité dans les moteurs génératifs
- **FAQPage avec contenu VISIBLE** : Google exige que les Q/R soient dans le DOM,
  pas seulement en JSON-LD (sinon spam de balisage → inéligibilité/action
  manuelle). Toujours injecter une **section FAQ visible** (accordéon `<details>`)
  dont le texte est **identique** au JSON-LD. C'est aussi le format le plus
  citable par les LLM (paires Q/R factuelles).
- **llms.txt** à la racine : résumé Markdown factuel (NAP, horaires, accès,
  cuisine, prix, réservation, FAQ). Aligné au mot près sur la source de vérité.
- **robots.txt** : autoriser explicitement les crawlers IA — `GPTBot`,
  `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `Claude-Web`, `PerplexityBot`,
  `Google-Extended`, `Applebot-Extended`, `Bingbot`, `CCBot`. Déclarer le `Sitemap`.
- Rédiger des **réponses autosuffisantes** : chaque réponse FAQ doit pouvoir être
  citée hors contexte (rappeler le nom + quartier dans la réponse).
- Couvrir les **questions réelles** posées aux IA (cf. recherche concurrentielle).

### 5. Mots-clés concurrentiels
- Analyser 5-8 concurrents locaux (titres/descriptions Google, longue traîne).
- Construire une liste priorisée FR (intention + géo + plat signature).
- Injecter naturellement dans `title`/description/FAQ/contenu — **pas** de
  `meta keywords` (ignoré par Google, signal spam).

### 6. Vérification
- Tous les blocs JSON-LD parsent en JSON valide.
- Générateur **idempotent** (relance = diff vide).
- Aucune balise dupliquée (1 `title`, 1 canonical, 1 bloc managé par page).
- Q/R JSON-LD **toutes présentes dans la section visible**.
- Longueurs title/description dans les cibles.
- Tester sur https://search.google.com/test/rich-results et soumettre le sitemap
  en Search Console.

## Règles d'or
1. **Exactitude > exhaustivité** : une donnée fausse nuit au SEO et à la confiance
   des LLM. Dans le doute, omettre et demander.
2. **SEO et GEO ensemble** : toute donnée structurée sert les deux ; tout contenu
   GEO (FAQ visible) sert aussi le SEO.
3. **Idempotence** : éditer les données, jamais le HTML généré.
4. **Cohérence NAP** absolue entre HTML, JSON-LD, llms.txt, sitemap.
5. Pas d'`AggregateRating`/avis sans avis réels ; pas de `meta keywords`.
