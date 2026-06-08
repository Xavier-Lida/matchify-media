# Spécification — Templates HTML Matchify Media

Format officiel pour créer des templates HTML qui se connectent automatiquement aux données de ligue.

---

## Fonctionnement général

Le template HTML est un fichier autonome stocké dans Supabase Storage. Au rendu, le système :

1. Injecte `window.TEMPLATE_DATA` (objet JSON) dans le `<head>`
2. Injecte le moteur `data-bind` qui lit les attributs et remplit le DOM
3. Appelle `__render()` une fois, puis à chaque mise à jour des données

Les données viennent de deux sources :
- **Automatique** — le projet de l'utilisateur (ligue, classement, horaire)
- **Manuelle** — le formulaire affiché à côté du template (tout ce qui n'est pas auto)

---

## Structure minimale d'un template

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="data.js"></script>
  <script src="image-slot.js"></script>
  <style>
    /* dimensions fixes = taille de l'export */
    html, body { margin: 0; width: 1080px; height: 1080px; overflow: hidden; }
  </style>
</head>
<body>

  <!-- contenu ici -->

  <script>
    /* script de rendu custom (optionnel) */
    window.__renderDataBind();   /* toujours appeler en premier */
  </script>
</body>
</html>
```

- `<script src="data.js">` → remplacé automatiquement par `window.TEMPLATE_DATA = {...}`
- `<script src="image-slot.js">` → remplacé par le polyfill du composant `<image-slot>`
- Le moteur `data-bind` est injecté juste après `data.js`

---

## Champs éditables avant l'export

Certains champs d'un template ne sont ni auto-remplis depuis la ligue, ni fixes — l'utilisateur doit les saisir juste avant d'exporter (ex. titre du post, numéro de journée, sous-titre).

### Comportement par défaut

Tout champ lié avec `data-bind-*` qui n'est **pas** rattaché à un requirement automatique apparaît automatiquement dans le panneau latéral de l'éditeur comme champ éditable.

```html
<!-- Apparaît dans le panneau : l'utilisateur saisit la valeur -->
<div class="title" data-bind="title"></div>
<div class="matchday" data-bind="matchday"></div>
```

### Personnaliser le label avec `data-label`

Le label affiché dans le panneau est généré depuis le nom de la clé (`matchday` → "Matchday"). Pour le personnaliser, ajouter `data-label` sur le même élément :

```html
<div data-bind="matchday" data-label="Journée"></div>
<span data-bind="title" data-label="Titre du post"></span>
```

### Masquer un champ du panneau (auto uniquement)

Pour qu'un champ soit rempli automatiquement **sans** apparaître dans le formulaire, lier la section correspondante à un requirement dans l'admin via **Données requises**. Le système assigne un `requirementId` à la section, qui la retire du panneau éditable.

### Valeur par défaut

Les valeurs par défaut des champs éditables se configurent dans l'admin → Modifier le template → section **Valeurs par défaut**. Un champ laissé vide par défaut sera caché si le CSS du template inclut `:empty { display: none; }`.

```css
.matchday:empty { display: none; } /* disparaît si vide */
```

### Champs éditables vs champs auto — résumé

| Champ | Comportement |
|---|---|
| `data-bind` sans requirement | Affiché dans le panneau, éditable |
| `data-bind` avec requirement | Auto-rempli, caché du panneau |
| `data-bind-src` (image) | Affiché comme sélecteur de photo |
| `data-bind-each` (liste) | Auto si requirement, sinon géré par le système |

---

## Attributs de liaison (`data-bind-*`)

### `data-bind="chemin"` — texte

Remplace `textContent` de l'élément par la valeur.

```html
<span data-bind="league.name"></span>
<span data-bind="match.home"></span>
<span data-bind="standings.0.name"></span>  <!-- premier élément du tableau -->
```

### `data-bind-src="chemin"` — image (URL)

Remplace l'attribut `src` ou l'attribut `src` de l'image interne d'un `<image-slot>`.

```html
<img data-bind-src="league.logo" />
<image-slot data-bind-src="team.logo" shape="circle" width="80" height="80"></image-slot>
```

### `data-bind-html="chemin"` — HTML brut

Remplace `innerHTML` (usage rare, pour du balisage dynamique).

```html
<div data-bind-html="match.result"></div>
```

### `data-bind-each="chemin"` — liste

Itère un tableau. Le contenu du `<template>` enfant est cloné pour chaque item. À l'intérieur du `<template>`, les chemins sont **relatifs à l'item courant**.

```html
<div data-bind-each="standings">
  <template>
    <div class="row">
      <span data-bind="name"></span>
      <span data-bind="pts"></span>
    </div>
  </template>
</div>
```

#### Contraintes de taille (optionnelles)

Déclarées dans le `<head>` via une balise `<meta>` pour que le formulaire admin puisse les afficher :

```html
<meta name="matchify:list:standings" content="min=4 max=16">
<meta name="matchify:list:matches" content="min=1 max=5">
```

Ces valeurs sont informatives — c'est le CSS/JS du template qui contrôle l'affichage réel.

### `data-bind-if="chemin"` — visibilité conditionnelle *(extension à implémenter)*

Masque l'élément si la valeur est absente, nulle ou vide. Permet aux templates de s'adapter au data disponible.

```html
<!-- affiché seulement si league.logo existe -->
<img data-bind-if="league.logo" data-bind-src="league.logo" />

<!-- affiché seulement si le match a un résultat -->
<div class="score-box" data-bind-if="match.result">
  <span data-bind="match.result"></span>
</div>
```

---

## Données automatiques (fournies par le projet)

Quand l'utilisateur a connecté une ligue à son projet, les clés suivantes sont injectées automatiquement dans `TEMPLATE_DATA`. Le template **n'a pas besoin** de les demander via le formulaire.

### Ligue

| Clé `TEMPLATE_DATA` | Type | Exemple |
|---|---|---|
| `league.name` | `string` | `"Ligue de futsal Québec"` |
| `league.division` | `string` | `"Division 1"` |
| `league.logo` | `string \| null` | URL ou `null` |

```html
<span data-bind="league.name"></span>
<span data-bind="league.division"></span>
<image-slot data-bind-src="league.logo" shape="rounded" fit="contain"></image-slot>
```

> Actuellement les clés dans `TEMPLATE_DATA` sont `leagueName`, `divisionName`, `leagueLogo` (format plat). La migration vers le format objet `league.name` etc. est à prévoir.

---

### Classement (`standings`)

Tableau trié par position croissante.

| Clé relative (dans `data-bind-each`) | Type | Description |
|---|---|---|
| `name` | `string` | Nom de l'équipe |
| `logo` | `string \| null` | URL du logo |
| `pts` | `number \| null` | Points |
| `pj` | `number \| null` | Matchs joués |
| `v` | `number \| null` | Victoires |
| `n` | `number \| null` | Nuls |
| `d` | `number \| null` | Défaites |
| `bp` | `number \| null` | Buts pour |
| `bc` | `number \| null` | Buts contre |
| `diff` | `number \| null` | Différentiel |

```html
<!-- Classement complet -->
<div data-bind-each="standings">
  <template>
    <div class="team-row">
      <image-slot data-bind-src="logo" shape="circle" width="32" height="32"></image-slot>
      <span data-bind="name"></span>
      <span data-bind="pts"></span>
      <span data-bind="pj"></span>
      <span data-bind="v"></span>
      <span data-bind="n"></span>
      <span data-bind="d"></span>
    </div>
  </template>
</div>
```

**Post "Top N" (JS nécessaire)** — si le template n'affiche que les 5 premières équipes :

```js
// Dans le script du template, après window.__renderDataBind()
const top5 = (window.TEMPLATE_DATA.standings || []).slice(0, 5);
// Rendre manuellement les 5 lignes
```

---

### Match unique (`match`)

Un objet représentant un match précis (dernier joué, prochain, ou choisi par l'utilisateur).

| Clé | Type | Exemple |
|---|---|---|
| `match.home` | `string` | `"Étoiles FC"` |
| `match.visitor` | `string` | `"Titans"` |
| `match.home_logo` | `string \| null` | URL |
| `match.visitor_logo` | `string \| null` | URL |
| `match.date` | `string` | `"2026-06-14"` |
| `match.time` | `string` | `"20:00"` |
| `match.day` | `string` | `"Samedi"` *(calculé)* |
| `match.venue` | `string` | `"Complexe sportif"` |
| `match.result` | `string` | `"3-1"` ou `""` si pas joué |
| `match.score_home` | `number \| null` | `3` |
| `match.score_visitor` | `number \| null` | `1` |

```html
<!-- Annonce de match -->
<div class="matchup">
  <image-slot data-bind-src="match.home_logo" shape="circle" width="120" height="120"></image-slot>
  <div class="vs">
    <span data-bind="match.home"></span>
    <span>vs</span>
    <span data-bind="match.visitor"></span>
  </div>
  <image-slot data-bind-src="match.visitor_logo" shape="circle" width="120" height="120"></image-slot>
</div>
<div class="info">
  <span data-bind="match.day"></span>
  <span data-bind="match.date"></span>
  <span data-bind="match.time"></span>
  <span data-bind="match.venue"></span>
</div>

<!-- Score (affiché seulement si joué) -->
<div class="score" data-bind-if="match.result">
  <span data-bind="match.score_home"></span>
  <span>–</span>
  <span data-bind="match.score_visitor"></span>
</div>
```

---

### Horaire / liste de matchs (`matches`)

Tableau de matchs (prochains ou résultats récents). Chaque item a les mêmes clés que `match.*` mais sans le préfixe.

| Clé relative | Type | Description |
|---|---|---|
| `home` | `string` | Équipe domicile |
| `visitor` | `string` | Équipe visiteur |
| `home_logo` | `string \| null` | Logo domicile |
| `visitor_logo` | `string \| null` | Logo visiteur |
| `date` | `string` | Date |
| `time` | `string` | Heure |
| `day` | `string` | Jour de la semaine *(calculé)* |
| `venue` | `string` | Terrain |
| `result` | `string` | Score ou `""` |

```html
<!-- Liste de 3 à 5 matchs -->
<meta name="matchify:list:matches" content="min=3 max=5">

<div data-bind-each="matches">
  <template>
    <div class="match-row">
      <span data-bind="day"></span>
      <span data-bind="date"></span>
      <span data-bind="home"></span>
      <span>vs</span>
      <span data-bind="visitor"></span>
      <span data-bind="result"></span>  <!-- vide si pas encore joué -->
    </div>
  </template>
</div>
```

---

### Joueurs (`players`) *(à venir)*

Structure en cours de définition. Format prévu :

| Clé relative | Type | Description |
|---|---|---|
| `name` | `string` | Nom complet |
| `number` | `number` | Numéro de maillot |
| `photo` | `string \| null` | Photo URL |
| `position` | `string` | Position (gardien, défenseur…) |
| `goals` | `number \| null` | Buts |
| `assists` | `number \| null` | Passes décisives |
| `team` | `string` | Nom de l'équipe |
| `team_logo` | `string \| null` | Logo de l'équipe |

```html
<!-- Post joueur de la semaine -->
<image-slot data-bind-src="player.photo" shape="circle" width="200" height="200"></image-slot>
<span data-bind="player.name"></span>
<span data-bind="player.number"></span>

<!-- Liste des meilleurs buteurs -->
<meta name="matchify:list:players" content="min=3 max=10">
<div data-bind-each="players">
  <template>
    <div class="scorer-row">
      <image-slot data-bind-src="photo" shape="circle" width="48" height="48"></image-slot>
      <span data-bind="name"></span>
      <span data-bind="team"></span>
      <span data-bind="goals"></span>
    </div>
  </template>
</div>
```

---

## Templates adaptatifs

Un template adaptatif s'affiche correctement que les données soient complètes ou partielles.

### Stratégie 1 — `data-bind-if` (déclaratif)

```html
<!-- Logo affiché seulement si disponible, texte toujours visible -->
<div class="team-identity">
  <image-slot data-bind-if="match.home_logo" data-bind-src="match.home_logo" ...></image-slot>
  <span data-bind="match.home"></span>
</div>
```

### Stratégie 2 — JS dans le script de rendu

Pour des logiques plus complexes (ex. changer la mise en page selon le nb de lignes) :

```html
<script>
  window.__renderDataBind();  // toujours en premier

  const data = window.TEMPLATE_DATA || {};
  const standings = data.standings || [];

  // Layout compact si > 10 équipes
  if (standings.length > 10) {
    document.querySelector('.standings-table').classList.add('compact');
  }

  // Masquer le bloc score si pas encore joué
  const hasResult = data.match?.result && data.match.result !== '';
  document.querySelector('.score-block')?.style.setProperty(
    'display', hasResult ? 'flex' : 'none'
  );
</script>
```

### Stratégie 3 — Sections `data-bind-each` avec CSS

Le moteur ne génère **aucun élément** si le tableau est vide. Un CSS `display:none` sur le conteneur parent (si vide) peut être géré via `:empty` ou JS.

---

## Composant `<image-slot>`

Élément HTML custom disponible dans tous les templates.

| Attribut | Valeurs | Défaut | Description |
|---|---|---|---|
| `src` | URL | — | Image à afficher |
| `fit` | `cover`, `contain`, `fill` | `cover` | Comportement de redimensionnement |
| `shape` | `rounded`, `circle`, `pill` | `rounded` | Forme du conteneur |
| `radius` | px | `12` | Rayon si `shape="rounded"` |
| `mask` | CSS `clip-path` | — | Masque custom (prioritaire sur `shape`) |

Doit avoir `width` et `height` définis (via CSS ou `style`).

```html
<image-slot
  src="https://example.com/logo.png"
  shape="circle"
  fit="contain"
  style="width:80px;height:80px;"
></image-slot>
```

---

## Dimensions et export

| Format | Dimensions recommandées |
|---|---|
| Post carré | `1080 × 1080 px` |
| Story / Reel | `1080 × 1920 px` |
| Bannière | `1200 × 630 px` |

Les dimensions sont déclarées dans la config admin du template (`canvasWidth` / `canvasHeight`). Le HTML doit correspondre :

```css
html, body {
  margin: 0;
  width: 1080px;   /* = canvasWidth */
  height: 1080px;  /* = canvasHeight */
  overflow: hidden;
}
```

---

## Checklist avant import

- [ ] `<script src="data.js">` présent dans le `<head>`
- [ ] `<script src="image-slot.js">` présent si `<image-slot>` utilisé
- [ ] Dimensions HTML = dimensions déclarées dans l'admin
- [ ] Chaque `data-bind-each` contient un `<template>` enfant
- [ ] `window.__renderDataBind()` appelé en premier dans le script custom
- [ ] Les balises `<meta name="matchify:list:*">` renseignées pour les listes
- [ ] Testé avec data manquante (valeurs `null` / `""`)
