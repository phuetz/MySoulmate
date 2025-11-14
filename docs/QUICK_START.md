# MySoulmate - Guide de Démarrage Rapide

Guide pour démarrer rapidement avec MySoulmate en 5 minutes.

## 🚀 Installation Rapide

### Option 1: Docker (Recommandé)

```bash
# 1. Cloner le repo
git clone https://github.com/phuetz/MySoulmate.git
cd MySoulmate

# 2. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos valeurs (au minimum JWT_SECRET, OPENAI_API_KEY)

# 3. Démarrer avec Docker
docker-compose up -d

# 4. Vérifier
curl http://localhost:3000/health
```

### Option 2: Installation Manuelle

```bash
# 1. Cloner le repo
git clone https://github.com/phuetz/MySoulmate.git
cd MySoulmate

# 2. Installer dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
nano .env  # Configurer JWT_SECRET, OPENAI_API_KEY, etc.

# 4. Démarrer le serveur backend
npm run dev

# 5. Dans un autre terminal, démarrer l'app mobile
npm start
```

## 📱 Accès aux Services

Une fois démarré, vous pouvez accéder à:

- **API Backend**: http://localhost:3000
- **Documentation API**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health
- **Métriques**: http://localhost:3000/metrics
- **Status Monitor**: http://localhost:3000/status

## 🔑 Configuration Minimale

### Variables Essentielles

Éditez `.env` avec au minimum:

```env
# OBLIGATOIRE
JWT_SECRET=changez_moi_par_une_valeur_aleatoire_longue

# RECOMMANDÉ pour fonctionnalités IA
OPENAI_API_KEY=votre_clé_openai

# RECOMMANDÉ pour paiements
STRIPE_SECRET_KEY=votre_clé_stripe
```

### Générer JWT_SECRET

```bash
# Linux/Mac
openssl rand -hex 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📖 Premiers Pas

### 1. Créer un Compte

```bash
# Via API
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'
```

### 2. Se Connecter

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'
```

Vous recevrez un `token` et un `sessionToken` à utiliser pour les requêtes authentifiées.

### 3. Tester une Requête Authentifiée

```bash
# Remplacer YOUR_TOKEN par le token reçu
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Session-Token: YOUR_SESSION_TOKEN"
```

## 🎨 App Mobile

### Démarrer l'App Expo

```bash
# Démarrer le serveur de développement
npm start

# Options:
# - Appuyer sur 'a' pour ouvrir sur Android
# - Appuyer sur 'i' pour ouvrir sur iOS
# - Scanner le QR code avec Expo Go
```

### Configuration API URL

Par défaut, l'app pointe vers `http://localhost:3000`.

Pour tester sur appareil physique:
1. Trouver votre IP locale: `ipconfig` (Windows) ou `ifconfig` (Mac/Linux)
2. Éditer `app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://YOUR_LOCAL_IP:3000/api/v1"
    }
  }
}
```

## 🧪 Tests

```bash
# Exécuter tous les tests
npm test

# Tests avec coverage
npm test -- --coverage

# Tests en mode watch
npm test -- --watch
```

## 🔧 Commandes Utiles

```bash
# Backend
npm run dev          # Démarrer serveur développement (avec nodemon)
npm start            # Démarrer serveur production
npm test             # Exécuter tests
npm run backup       # Backup base de données
npm run cleanup      # Nettoyer anciennes données

# Frontend Mobile
npm start            # Démarrer Expo
npm run ios          # Démarrer sur iOS
npm run android      # Démarrer sur Android
npm run web          # Démarrer version web

# Documentation
npm run docs         # Générer documentation API
```

## 📊 Monitoring

### Health Checks

```bash
# Check basique
curl http://localhost:3000/health

# Check détaillé avec infos système
curl http://localhost:3000/health/detailed

# Readiness (pour K8s)
curl http://localhost:3000/health/ready

# Liveness (pour K8s)
curl http://localhost:3000/health/live
```

### Métriques

```bash
# Métriques Prometheus
curl http://localhost:3000/metrics

# Status dashboard
# Ouvrir dans navigateur: http://localhost:3000/status
```

## 🐛 Troubleshooting

### Port déjà utilisé

```bash
# Trouver le processus utilisant le port 3000
lsof -i :3000

# Tuer le processus
kill -9 PID
```

### Base de données corrompue

```bash
# Supprimer et recréer
rm database.sqlite
npm run dev  # Se recréera automatiquement
```

### Problèmes de dépendances

```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
```

### Expo ne démarre pas

```bash
# Nettoyer cache
npx expo start -c

# Réinstaller Expo CLI
npm install -g expo-cli
```

## 📚 Documentation Complète

Pour plus d'informations:

- **README.md**: Vue d'ensemble du projet
- **IMPROVEMENTS.md**: Liste des améliorations implémentées
- **docs/DEPLOYMENT.md**: Guide de déploiement production
- **API Documentation**: http://localhost:3000/api-docs

## 🆘 Support

Besoin d'aide?

- **Documentation**: Lire les docs dans `/docs`
- **Issues GitHub**: Ouvrir une issue
- **Email**: support@mysoulmate.app

## ✅ Checklist de Démarrage

- [ ] Repository cloné
- [ ] Dépendances installées (`npm install`)
- [ ] Fichier `.env` configuré
- [ ] JWT_SECRET généré
- [ ] Serveur backend démarré (`npm run dev`)
- [ ] Health check OK (`curl http://localhost:3000/health`)
- [ ] Documentation API accessible (`http://localhost:3000/api-docs`)
- [ ] App mobile démarrée (`npm start`)
- [ ] Compte créé via API ou app
- [ ] Login réussi

## 🎉 Prochaines Étapes

Une fois l'installation terminée:

1. **Explorer l'API**: Visitez http://localhost:3000/api-docs
2. **Tester les endpoints**: Utilisez Postman ou curl
3. **Personnaliser**: Configurez les feature flags dans `.env`
4. **Développer**: Ajoutez vos propres fonctionnalités
5. **Déployer**: Suivez le guide de déploiement

---

**Temps estimé**: 5-10 minutes
**Difficulté**: Débutant
**Dernière mise à jour**: 2025-01-14
