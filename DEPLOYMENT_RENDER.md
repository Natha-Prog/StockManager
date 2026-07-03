# Déploiement sur Render

Ce guide explique comment déployer l'application StockManager sur Render.

## Prérequis

- Compte GitHub avec le code du projet
- Compte Render (https://render.com)
- Le projet doit être poussé sur GitHub

## Étapes de déploiement

### 1. Préparer le code

Assurez-vous que tous les fichiers de configuration sont présents :
- `render.yaml` (configuration Render)
- `backend/db/postgres.js` (connexion PostgreSQL)
- `backend/package.json` (avec dépendance pg)

### 2. Pousser le code sur GitHub

```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### 3. Créer un compte Render et connecter GitHub

1. Allez sur https://render.com
2. Créez un compte ou connectez-vous
3. Dans les paramètres, connectez votre compte GitHub
4. Autorisez Render à accéder à votre dépôt

### 4. Déployer avec render.yaml

Render détectera automatiquement le fichier `render.yaml` et créera les services :

1. **Nouveau projet** → "New +"
2. **"Connect Repository"** → Sélectionnez votre dépôt
3. Render détectera `render.yaml` et proposera de créer les services
4. **Confirmez** la création des services

Les services suivants seront créés automatiquement :
- **PostgreSQL Database** : `stockmanager-db`
- **Backend Web Service** : `stockmanager-backend`
- **Frontend Static Site** : `stockmanager-frontend`

### 5. Configurer les variables d'environnement

Après le déploiement initial, configurez les variables dans le dashboard Render :

#### Backend (stockmanager-backend)
- `PORT`: 5000
- `NODE_ENV`: production
- `DATABASE_URL`: (automatiquement liée à PostgreSQL)
- `JWT_SECRET`: (généré automatiquement)
- `JWT_EXPIRES_IN`: 8h
- `CORS_ORIGIN`: `https://stockmanager-frontend.onrender.com`
- `ADMIN_EMAIL`: votre email admin
- `ADMIN_PASSWORD`: votre mot de passe admin

#### Frontend (stockmanager-frontend)
- `VITE_API_URL`: `https://stockmanager-backend.onrender.com/api`

### 6. Mettre à jour les URLs

Une fois les services déployés, vous obtiendrez des URLs du type :
- Backend: `https://stockmanager-backend.onrender.com`
- Frontend: `https://stockmanager-frontend.onrender.com`

Mettez à jour la variable `CORS_ORIGIN` dans le backend avec l'URL frontend réelle.

## Structure de déploiement

```
Render Services:
├── PostgreSQL Database (stockmanager-db)
│   └── Base de données persistante
├── Web Service (stockmanager-backend)
│   ├── Node.js 18+
│   ├── Port: 5000
│   └── Connecté à PostgreSQL
└── Static Site (stockmanager-frontend)
    ├── Vite build
    ├── Nginx (automatique)
    └── Connecté au backend
```

## Compte administrateur par défaut

Le premier utilisateur admin sera créé automatiquement avec les identifiants configurés dans les variables d'environnement :
- Email: `ADMIN_EMAIL`
- Mot de passe: `ADMIN_PASSWORD`

**Important**: Changez ces identifiants après le premier login.

## Dépannage

### Erreur de connexion PostgreSQL
- Vérifiez que `DATABASE_URL` est correctement liée à la base de données
- Assurez-vous que SSL est activé (configuré dans `postgres.js`)

### Erreur CORS
- Vérifiez que `CORS_ORIGIN` correspond exactement à l'URL frontend
- Incluez le protocole (https://) et le domaine complet

### Frontend ne se connecte pas au backend
- Vérifiez que `VITE_API_URL` est correctement configuré
- Assurez-vous que le backend est en cours d'exécution

### Build échoue
- Vérifiez les logs de build dans le dashboard Render
- Assurez-vous que toutes les dépendances sont dans `package.json`

## Coûts

Avec le plan gratuit Render :
- PostgreSQL: 90 jours gratuits, puis $7/mois
- Web Services: 750 heures/mois gratuites
- Static Sites: Illimité gratuit

Pour un usage personnel ou test, le plan gratuit est suffisant.

## Mise à jour du déploiement

Pour mettre à jour l'application :

```bash
git add .
git commit -m "Update application"
git push origin main
```

Render détectera automatiquement le push et redéploiera les services.

## Surveillance

- Consultez les logs dans le dashboard Render
- Surveillez l'utilisation des ressources
- Configurez des alertes si nécessaire
