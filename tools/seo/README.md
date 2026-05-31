# Gestion SEO / GEO — A Braccetto

Système de **gestion centralisée** du référencement (SEO) et de l'optimisation pour
moteurs génératifs (GEO : ChatGPT, Perplexity, Google AI Overviews…) du site
`abraccettoparis.com`.

Aucune dépendance, aucun build. Un seul script Node régénère tout depuis deux
fichiers de données.

## Fichiers

| Fichier | Rôle |
|---|---|
| `business-data.json` | **Source de vérité** : nom, adresse (NAP), horaires, géoloc, réservation, réseaux, FAQ. |
| `pages.json` | Par page : `title`, `description`, schémas JSON-LD à injecter, priorité sitemap, indexabilité. |
| `generate.mjs` | Générateur idempotent. |

## Utilisation

```bash
node tools/seo/generate.mjs
```

Le script :

1. injecte/met à jour dans chaque `<head>` un bloc managé entre
   `<!-- SEO-GEO:START -->` et `<!-- SEO-GEO:END -->` :
   `<title>` optimisé, `meta description`, `robots`, `canonical`,
   `hreflang x-default`, Open Graph (+ `og:image:alt`), Twitter Card,
   balises `geo.*`/`ICBM`, et **JSON-LD** (Restaurant/LocalBusiness, WebSite,
   Organization, BreadcrumbList, FAQPage selon la page) ;
2. pour les pages déclarant le schéma `faq`, injecte aussi une **section FAQ
   visible** dans le `<body>`, juste avant `<footer>`, entre
   `<!-- SEO-GEO-FAQ:START -->` et `<!-- SEO-GEO-FAQ:END -->`. Google exige que
   le contenu d'un `FAQPage` soit visible : le texte affiché (FR, inline) est
   donc identique au JSON-LD ;
3. régénère à la racine **`robots.txt`**, **`sitemap.xml`**, **`llms.txt`**.

### FAQ visible et traductions

La section FAQ est rendue en **français inline** (source = `business-data.json`),
ce qui garantit la correspondance exacte avec le JSON-LD. Chaque question/réponse
porte une clé `data-i18n` (`Faq-q-<id>`, `Faq-a-<id>`, titre `Faq-titre`) :

- le **français** vient du texte inline (pas de clé dans `fr.json` → le résolveur
  i18n conserve le texte affiché) ;
- l'**anglais** et l'**espagnol** sont dans `assets/i18n/en.json` et
  `assets/i18n/es.json`. **Si tu ajoutes/modifies une question dans
  `business-data.json`, ajoute la clé correspondante dans ces deux fichiers.**

> ⚠️ Ne pas éditer le bloc `SEO-GEO` à la main : il est écrasé à chaque exécution.
> Modifier les `.json` puis relancer. Le script est **idempotent** (relançable sans
> accumulation).

## Maintenance courante

| Besoin | Action |
|---|---|
| Changer un titre / une description | Éditer `pages.json` → relancer |
| Modifier horaires, adresse, réservation, FAQ | Éditer `business-data.json` → relancer |
| **Renseigner le téléphone** | Mettre la valeur dans `business-data.json` (`telephone`) → relancer. Tant qu'il est vide, il est volontairement omis. |
| Ajouter une page | Ajouter une entrée dans `pages.json` → relancer |
| Ajouter une Q/R pour le GEO | Ajouter un objet dans `faq[]` de `business-data.json` → relancer |

## Décisions & limites

- **i18n** : le site traduit côté client (FR/EN/ES sur une **seule URL** par page).
  Le vrai `hreflang` multi-URL n'est donc pas applicable ; on déclare un
  `hreflang="x-default"` sur l'URL canonique et les `og:locale:alternate`.
  Pour un référencement multilingue complet, il faudrait des URLs dédiées
  (`/en/…`, `/es/…`) — hors périmètre actuel.
- **Pages légales** (`legal-notice`, `terms-of-use`, `privacy-policy`,
  `cookie-policy`) : `robots: noindex, follow` et exclues du sitemap.
- **Crawlers IA** : `robots.txt` les autorise explicitement (GPTBot, ClaudeBot,
  PerplexityBot, Google-Extended…) pour maximiser la visibilité GEO. Pour les
  bloquer, passer leurs blocs en `Disallow: /` dans `generate.mjs`.
- **GPS** : approximés depuis l'embed Google Maps. Affiner si besoin via la fiche
  Google Business Profile.
- **Validation** : tester les données structurées sur
  <https://search.google.com/test/rich-results> et le sitemap dans la
  Google Search Console.
