# Déploiement : Vercel + Render + Supabase

Architecture :

```
Vercel    → frontend React (statique)
Render    → API Express (Node)
Supabase  → PostgreSQL
```

## 1. Supabase (base de données)

1. Créez un projet sur https://supabase.com
2. Allez dans **Project Settings → Database → Connection string**
3. Choisissez l’URI adaptée :

| Usage | Variable | Port | Exemple |
|-------|----------|------|---------|
| **API Render (recommandé)** | `DATABASE_URL` | `5432` session pooler | `postgresql://postgres.[ref]:[PASSWORD]@aws-0-....pooler.supabase.com:5432/postgres` |
| Alternative IPv4-only | `DATABASE_URL` | `6543` transaction + `?pgbouncer=true` | `...pooler.supabase.com:6543/postgres?pgbouncer=true` |

4. Remplacez `[YOUR-PASSWORD]` / `[PASSWORD]` par le mot de passe de la base  
   (caractères spéciaux à encoder : `@` → `%40`, `#` → `%23`, etc.)

> Pour ce projet Express sur Render, utilisez le **session-mode pooler (5432)** comme `DATABASE_URL`.

Les tables (`users`, `products`, etc.) sont créées automatiquement au démarrage de l’API.

## 2. Render (API)

1. Poussez le code sur GitHub
2. Sur https://render.com → **New +** → **Blueprint**
3. Connectez le dépôt : Render lit `render.yaml` et crée `stockmanager-backend`
4. Renseignez les variables marquées *sync: false* :

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | URI Postgres Supabase (étape 1) |
| `CORS_ORIGIN` | URL Vercel, ex. `https://votre-app.vercel.app` |
| `ADMIN_EMAIL` | Email admin initial |
| `ADMIN_PASSWORD` | Mot de passe admin initial |

`JWT_SECRET` est généré automatiquement.

5. Après le déploiement, notez l’URL API, ex. `https://stockmanager-3.onrender.com`
6. Vérifiez : `https://stockmanager-3.onrender.com/api/health`

> Plan gratuit Render : le service s’endort après inactivité (~15 min). Le premier appel peut prendre ~30–50 s.

## 3. Vercel (frontend)

1. Sur https://vercel.com → **Add New…** → **Project**
2. Importez le dépôt GitHub `StockManager`
3. Configurez le projet :
   - **Framework Preset** : Vite
   - **Root Directory** : `frontend` (bouton *Edit*)
   - **Build Command** : `npm run build` (détecté)
   - **Output Directory** : `dist` (détecté)
4. Ajoutez la variable d’environnement :

| Variable | Valeur |
|----------|--------|
| `VITE_API_URL` | `https://stockmanager-3.onrender.com/api` |

5. **Deploy**

> `VITE_API_URL` est injectée au **build** : si vous la changez après, refaites un déploiement.

Le fichier `frontend/vercel.json` gère le routing SPA (React Router).

## 4. Finaliser CORS

Dès que l’URL Vercel est connue :

1. Sur Render → service backend → Environment
2. Mettez `CORS_ORIGIN` = `https://votre-app.vercel.app` (sans slash final)
3. Redéployez le backend si besoin

Si vous avez aussi un domaine custom Vercel, ajoutez-le (séparé par des virgules) :
`https://votre-app.vercel.app,https://www.votredomaine.com`

## Ordre recommandé

1. Supabase (récupérer `DATABASE_URL`)
2. Render (déployer l’API)
3. Vercel (déployer le frontend avec `VITE_API_URL`)
4. Mettre à jour `CORS_ORIGIN` sur Render

## Compte admin

Créé au premier démarrage de l’API avec `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Changez le mot de passe après la première connexion.

## Dépannage

| Problème | À vérifier |
|----------|------------|
| Erreur connexion DB | `DATABASE_URL` correcte, mot de passe sans caractères mal encodés (`@` → `%40`, etc.), SSL (activé en production) |
| CORS bloqué | `CORS_ORIGIN` = URL Vercel exacte (`https://...`) |
| Frontend sans API | `VITE_API_URL` défini **avant** le build Vercel, puis redeploy |
| API lente au réveil | Normal sur le free tier Render (cold start) |
| 404 sur refresh d’une route | Vérifier `frontend/vercel.json` (rewrites SPA) |
