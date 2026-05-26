This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API image (POST → PNG)

Génération programmatique du visuel **fulltime** pour intégration depuis un autre site.

- Documentation : [docs/API.md](docs/API.md)
- **Déploiement Railway** : [docs/DEPLOY-RAILWAY.md](docs/DEPLOY-RAILWAY.md)
- Exemple de payload : [examples/fulltime-api-payload.json](examples/fulltime-api-payload.json)
- Variables d’environnement : [.env.example](.env.example)

```bash
npm run playwright:install   # une fois, pour Chromium
npm run build && npm run start
curl -X POST http://localhost:3000/api/v1/images/fulltime \
  -H "Authorization: Bearer $MATCHIFY_API_KEY" \
  -H "Content-Type: application/json" \
  -d @examples/fulltime-api-payload.json \
  --output matchify-fulltime.png
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy

Production recommandée : **Railway** (Docker + Playwright). Voir [docs/DEPLOY-RAILWAY.md](docs/DEPLOY-RAILWAY.md).
