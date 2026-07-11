# Application de Gestion de Stock

Application full-stack professionnelle pour la gestion de stock avec authentification, rôles et traçabilité des mouvements.

## Fonctionnalités

- **Authentification JWT** avec rôles Admin et Opérateur
- **Tableau de bord** : KPIs, graphique hebdomadaire, activité récente, alertes stock faible
- **Gestion des produits** : CRUD (admin), pagination, recherche, export CSV
- **Mouvements de stock** : entrées/sorties avec traçabilité utilisateur, filtres, validation stock
- **Gestion des utilisateurs** (admin uniquement)
- **Sécurité** : Helmet, CORS restreint, rate limiting, validation serveur
- **Déploiement Docker** prêt à l'emploi

## Technologies

- **Frontend** : React 18, Vite, TailwindCSS, React Router, Recharts, Axios
- **Backend** : Node.js, Express, SQLite, JWT, bcrypt
- **Tests** : Jest, Supertest

## Installation rapide

```bash
npm run install-all
```

## Démarrage en développement

```bash
# Terminal 1 — Backend
cd backend
cp .env.example .env
npm run dev

# Terminal 2 — Frontend
cd frontend
cp .env.example .env
npm run dev
```

Ou depuis la racine :

```bash
npm run dev
```

- Frontend : http://localhost:3000
- Backend : http://localhost:5000

## Compte administrateur par défaut

| Champ | Valeur |
|-------|--------|
| Email | `admin@stock.local` |
| Mot de passe | `admin123` |

> Changez ces identifiants en production via les variables `ADMIN_EMAIL` et `ADMIN_PASSWORD`.

## Matrice des rôles

| Action | Admin | Opérateur |
|--------|-------|-----------|
| Voir dashboard / produits / mouvements | oui | oui |
| Créer / modifier / supprimer produits | oui | non |
| Enregistrer mouvements de stock | oui | oui |
| Gérer les utilisateurs | oui | non |
| Exporter CSV | oui | oui |

## Variables d'environnement

### Backend (`backend/.env`)

| Variable | Description | Défaut |
|----------|-------------|--------|
| `PORT` | Port du serveur | `5000` |
| `JWT_SECRET` | Clé secrète JWT | — |
| `JWT_EXPIRES_IN` | Durée du token | `8h` |
| `CORS_ORIGIN` | Origine autorisée | `http://localhost:3000` |
| `DB_PATH` | Chemin base SQLite | `./stock.db` |
| `ADMIN_EMAIL` | Email admin initial | `admin@stock.local` |
| `ADMIN_PASSWORD` | Mot de passe admin initial | `admin123` |

### Frontend (`frontend/.env`)

| Variable | Description | Défaut |
|----------|-------------|--------|
| `VITE_API_URL` | URL de l'API | `http://localhost:5000/api` |

## API Endpoints

| Méthode | Route | Auth | Rôle |
|---------|-------|------|------|
| GET | `/api/health` | non | — |
| POST | `/api/auth/login` | non | — |
| GET | `/api/auth/me` | oui | tous |
| GET/POST/DELETE | `/api/users` | oui | admin |
| GET/POST/PUT/DELETE | `/api/products` | oui | lecture: tous, écriture: admin |
| GET/POST | `/api/stock-movements` | oui | tous |
| GET | `/api/statistics` | oui | tous |

## Tests

```bash
cd backend
npm test
```

## Déploiement (production)

- **Vercel** → frontend  
- **Render** → API Express  
- **Supabase** → PostgreSQL  

Voir le guide détaillé : [DEPLOYMENT.md](./DEPLOYMENT.md)

## Déploiement Docker (local / mono-service)

```bash
# Créer un fichier .env à la racine avec JWT_SECRET
docker-compose up --build
```

- Frontend : http://localhost
- Backend : http://localhost:5000

## Règles métier

- Le **stock** n'est modifiable que via les mouvements (entrée/sortie)
- Une **sortie** est refusée si le stock est insuffisant
- Un produit avec des **mouvements** ne peut pas être supprimé
- Chaque mouvement est **tracé** avec l'utilisateur qui l'a enregistré

## Structure du projet

```
Analyseo/
├── backend/
│   ├── config/          # Configuration environnement
│   ├── db/              # Connexion SQLite
│   ├── middleware/      # Auth, validation, erreurs
│   ├── routes/          # Routes API modulaires
│   ├── seed/            # Données initiales
│   ├── tests/           # Tests automatisés
│   └── server.js
├── frontend/
│   └── src/
│       ├── api/         # Client Axios
│       ├── components/  # UI réutilisable
│       ├── context/     # Auth, Toast
│       └── pages/       # Pages de l'application
└── docker-compose.yml
```
