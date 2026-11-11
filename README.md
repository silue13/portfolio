# Portfolio

Site portfolio personnel : projets Data & Web, parcours, compétences, formulaire de contact et espace d'administration.

**Stack** : Next.js, React, Tailwind CSS, Neon (PostgreSQL serverless), déploiement Vercel.

## Démarrage

```bash
npm install
npm run dev
```

Ouvre http://localhost:3000. L'administration est sur `/admin`.

## Variables d'environnement (`.env.local`)

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | Chaîne de connexion Neon (base `portfolio`) |
| `ADMIN_PASSWORD` | Mot de passe de l'espace admin (12 caractères ou plus) |
| `AUTH_SECRET` | Clé secrète longue et aléatoire qui signe la session admin |
| `NEXT_PUBLIC_SITE_URL` | (optionnel) URL publique du site, ex. `https://monsite.vercel.app` |

Ces mêmes variables doivent être ajoutées dans Vercel (Settings → Environment Variables).

## Base de données

Tables : `projects`, `education`, `profile`, `contact_messages`.
Pour le formulaire de contact, exécute une fois `db/contact_messages.sql` dans l'éditeur SQL de Neon.
