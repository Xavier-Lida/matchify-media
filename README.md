# Futsal Content Generator

Micro logiciel web gratuit qui permet aux ligues et équipes de futsal de générer
des images de contenu Instagram à partir de templates prédéfinis. L'admin importe
les templates, les utilisateurs les remplissent et téléchargent le résultat en
PNG/JPG.

> Implémentation conforme à `SPEC.md`.

## Stack

| Couche | Techno |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Langage | TypeScript |
| Styling | Tailwind CSS v4 |
| Canvas client | Konva.js / react-konva |
| Canvas serveur | @napi-rs/canvas |
| Base de données / Storage / Auth | Supabase |
| Scraping | Cheerio |

## Architecture

```
app/
├── page.tsx                  # Browse — liste des templates actifs
├── template/[id]/page.tsx    # Éditeur canvas (Konva) + formulaire dynamique
├── admin/
│   ├── login/page.tsx        # Connexion admin (Supabase Auth)
│   ├── page.tsx              # Dashboard
│   └── templates/
│       ├── page.tsx          # Gestion (activer/désactiver/supprimer)
│       └── new/page.tsx      # Création (3 étapes + form builder)
└── api/
    ├── generate/route.ts     # POST — rendu serveur (clé API Bearer)
    └── spordle/route.ts      # GET — scraping Spordle
components/
├── SiteHeader.tsx
├── TemplateCard.tsx
├── editor/                   # CanvasEditor, DynamicForm, SpordleImport, …
└── admin/                    # FieldBuilder, TemplateCreator, TemplatesManager
lib/
├── types.ts                  # Types partagés (Field, JsonConfig, …)
├── canvas.ts                 # Logique de rendu PURE (buildRenderPlan)
├── canvas-server.ts          # Exécuteur de rendu serveur (@napi-rs/canvas)
├── fonts.ts / fonts-server.ts# Polices client / enregistrement serveur
├── spordle.ts                # Scraping Cheerio
├── templates.ts              # Accès données Supabase
└── supabase/                 # Clients browser / server / admin
proxy.ts                      # Protection des routes /admin (ex-middleware)
supabase/schema.sql           # Schéma DB + buckets + RLS
```

La logique de rendu est partagée : `buildRenderPlan(config, values, overrides)`
(dans `lib/canvas.ts`) produit une liste d'instructions de dessin, exécutée soit
par Konva (client, temps réel), soit par `@napi-rs/canvas` (serveur, API).

## Démarrage

1. Installer les dépendances :

```bash
npm install
```

2. Configurer Supabase :
   - Créer un projet sur [supabase.com](https://supabase.com).
   - Exécuter `supabase/schema.sql` dans l'éditeur SQL (crée la table
     `templates`, les buckets `templates`/`previews` et les politiques RLS).
   - Créer le compte admin unique : **Authentication → Users → Add user**
     (email + mot de passe).

3. Variables d'environnement — copier `.env.example` vers `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...   # sb_publishable_… (ou anon legacy)
SUPABASE_SECRET_KEY=...                    # sb_secret_… (ou service_role legacy)
MATCHIFY_API_KEY=...                       # header Bearer pour /api/generate
ADMIN_EMAIL=...                            # même email que le compte Supabase Auth
```

Les anciennes variables `NEXT_PUBLIC_SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY`
restent supportées en secours.

4. Lancer :

```bash
npm run dev
```

Sans configuration Supabase, l'UI s'affiche en mode « non configuré » plutôt que
de planter.

## API Matchify — `POST /api/generate`

```bash
curl -X POST https://<host>/api/generate \
  -H "Authorization: Bearer $MATCHIFY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "<uuid>",
    "fields": {
      "equipe_dom": "Dynamo FC", "score_dom": 4,
      "score_ext": 2, "equipe_ext": "Lions TR",
      "logo_dom": "https://…/dynamo.png",
      "buteurs": [{ "nom": "Tremblay", "buts": 2 }]
    }
  }' --output resultat.png
```

Réponses : `200` PNG · `401` clé invalide · `404` template introuvable/inactif ·
`422` champs requis manquants (clés listées) · `500` erreur de rendu.

## Scraping Spordle — `GET /api/spordle?url=...`

Valide que le domaine est bien `spordle.com` (sinon `400`), scrape la page et
renvoie `SpordleMatchData`. `502` si le site est indisponible ou si sa structure
a changé.

> ⚠️ Les sélecteurs CSS de `lib/spordle.ts` sont heuristiques et doivent être
> vérifiés/ajustés sur le HTML réel de Spordle (documenter la date d'inspection
> dans le fichier).

## Polices

Inter, Oswald, Bebas Neue, Montserrat, Roboto Condensed (via `@fontsource`) +
Arial système. Chargées côté client par `globals.css` et enregistrées côté
serveur via `GlobalFonts` (`lib/fonts-server.ts`).

## Hors scope v1

Historique par utilisateur, publication Instagram directe, templates vidéo,
multi-admin, drag & drop des champs (positions x/y saisies manuellement).
