# MySoulmate - AI Companion Application

<div align="center">
  <h3>🤖 Une application de compagnon IA moderne et immersive</h3>
  <p>Créez des relations personnalisées avec des compagnons IA avancés grâce à des conversations, des interactions vocales, vidéo, et des expériences en réalité augmentée.</p>
</div>

## 📱 Vue d'ensemble

MySoulmate est une application complète de compagnon IA construite avec React Native et Expo. Elle permet aux utilisateurs de créer et personnaliser des compagnons IA avec des personnalités uniques, d'avoir des conversations enrichissantes, et d'explorer des interactions immersives incluant la voix, la vidéo, et la réalité augmentée.

### ✨ Fonctionnalités principales

#### 🎭 **Compagnons IA personnalisés**
- Création de compagnons avec des traits de personnalité uniques
- Personnalisation d'apparence avec plusieurs avatars
- Génération d'avatars par IA à partir de vos photos
- Développement de relations basé sur les interactions
- Système de mémoire pour des conversations cohérentes

#### 💬 **Conversations avancées**
- Chat en temps réel avec réponses IA intelligentes
- Support des conversations NSFW (premium)
- Historique des conversations
- Réactions et émojis

#### 🎧 **Interactions multimédia**
- Conversations vocales en temps réel
- Appels vidéo simulés
- Enregistrement et lecture audio
- Effets visuels et filtres

#### 🌟 **Réalité augmentée**
- Visualisation du compagnon dans l'environnement réel
- Positionnement et redimensionnement 3D
- Capture de photos AR
- Interactions tactiles

#### 🎁 **Système de cadeaux**
- Boutique de cadeaux virtuels
- Monnaie virtuelle
- Effets sur les relations
- Inventaire personnel

#### 🔔 **Notifications intelligentes**
- Alertes personnalisées
- Notifications basées sur vos interactions
- Rappels d'interaction
- Messages programmés
- Support push notifications
- Notifications rapides sur montres connectées

#### 🎮 **Gamification et jeux**
- Système de niveaux et XP
- Mini-jeux interactifs avec le compagnon
- Achievements et défis
- Quiz et jeux de mémoire

#### 📝 **Journal intime partagé**
- Écriture de journal avec réponses du compagnon
- Suivi d'humeurs et émotions
- Entrées privées ou partagées
- Historique des moments importants

#### 📅 **Calendrier des rendez-vous**
- Planification d'événements avec le compagnon
- Rappels automatiques
- Différents types d'activités
- Suivi des moments passés ensemble

#### 👑 **Fonctionnalités premium**
- Contenu NSFW
- Avatars exclusifs
- Conversations illimitées
- Fonctionnalités AR avancées

#### 🛡️ **Panel d'administration**
- Gestion des utilisateurs
- Gestion des produits et catégories
- Analytiques détaillées
- Gestion des abonnements
- Système de notifications
- Configuration des paramètres

## 🛠️ Technologies utilisées

### Frontend
- **React Native** - Framework de développement mobile cross-platform
- **Expo** - Plateforme de développement et déploiement
- **TypeScript** - Typage statique pour JavaScript
- **Expo Router** - Navigation basée sur les fichiers
- **NativeWind** - Styling utilitaire (Tailwind CSS pour React Native)
- **Lucide Icons** - Bibliothèque d'icônes modernes
- **React Native Chart Kit** - Graphiques et visualisations de données
- **Context API** - Gestion d'état global
- **AsyncStorage** - Stockage local persistant
- **Expo Camera** - Fonctionnalités caméra et AR

### Backend (API)
- **Node.js** - Runtime JavaScript serveur
- **Express.js** - Framework web pour Node.js
- **SQLite** - Base de données légère
- **Sequelize** - ORM pour JavaScript
- **JWT** - Authentification par tokens
- **bcryptjs** - Hachage des mots de passe
- **Swagger** - Documentation API

### Outils de développement
- **Jest** - Framework de tests
- **ESLint** - Linter JavaScript/TypeScript
- **Prettier** - Formatage de code
- **Winston** - Logging avancé

## 🚀 Installation et configuration

### Prérequis
- Node.js (v16 ou supérieur)
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)
- Appareil physique ou émulateur pour les tests

### Installation

1. **Cloner le repository**
```bash
git clone https://github.com/yourusername/mysoulmate-app.git
cd mysoulmate-app
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration de l'environnement**
```bash
# Copier le fichier d'exemple
cp .env.example .env

# Modifier les variables d'environnement selon votre configuration
```
Assurez-vous notamment de renseigner `OPENAI_API_KEY` pour activer la génération d'avatars par IA.
Vous pouvez également définir `FALLBACK_AI_URL` pour spécifier un service de secours en cas d'indisponibilité d'OpenAI.

4. **Initialiser la base de données**
```bash
# Démarrer le serveur backend
npm run dev

# La base de données SQLite sera créée automatiquement
```

5. **Lancer l'application**
```bash
# Démarrer le serveur de développement
npm start

# Ou lancer directement sur un appareil/émulateur
npm run ios     # Pour iOS
npm run android # Pour Android
npm run web     # Pour le web
```

### Configuration de l'API Backend

1. **Démarrer le serveur API**
```bash
cd api
npm install
npm run dev
```

2. **Accéder à la documentation API**
- API: `http://localhost:3000`
- Documentation Swagger: `http://localhost:3000/api-docs`
 - Documentation statique générée: ouvrir `docs/index.html` après avoir exécuté `npm run docs`

3. **Configurer l'URL de l'API côté application**
   - Par défaut, l'application mobile pointe vers `http://localhost:3000/api/v1`.
   - Vous pouvez changer cette URL en modifiant la valeur `expo.extra.apiUrl` dans `app.json` ou via la variable d'environnement `EXPO_PUBLIC_API_URL`.

## 📁 Structure du projet

```
mysoulmate-app/
├── app/                          # Écrans principaux de l'application
│   ├── (tabs)/                   # Navigation par onglets
│   │   ├── index.tsx             # Écran d'accueil
│   │   ├── chat.tsx              # Interface de chat
│   │   ├── voice.tsx             # Conversations vocales
│   │   ├── video.tsx             # Appels vidéo
│   │   ├── ar-view.tsx           # Réalité augmentée
│   │   ├── gifts.tsx             # Boutique de cadeaux
│   │   ├── customize.tsx         # Personnalisation
│   │   ├── journal.tsx           # Journal intime
│   │   ├── games.tsx             # Mini-jeux
│   │   ├── calendar.tsx          # Calendrier
│   │   ├── notifications.tsx     # Notifications
│   │   └── settings.tsx          # Paramètres
│   ├── admin/                    # Module d'administration
│   │   ├── index.tsx             # Dashboard admin
│   │   ├── users.tsx             # Gestion des utilisateurs
│   │   ├── products.tsx          # Gestion des produits
│   │   ├── categories.tsx        # Gestion des catégories
│   │   ├── subscriptions.tsx     # Gestion des abonnements
│   │   ├── analytics.tsx         # Analytiques
│   │   └── settings.tsx          # Paramètres admin
│   ├── auth/                     # Authentification
│   │   ├── login.tsx             # Connexion
│   │   └── register.tsx          # Inscription
│   ├── _layout.tsx               # Layout racine
│   └── index.tsx                 # Point d'entrée
├── components/                   # Composants réutilisables
│   ├── admin/                    # Composants d'administration
│   └── ...                       # Autres composants
├── context/                      # Gestion d'état global
│   ├── AppStateContext.tsx       # État de l'application
│   └── AuthContext.tsx           # État d'authentification
├── services/                     # Services API
│   ├── api.ts                    # Configuration API de base
│   ├── authService.ts            # Service d'authentification
│   ├── notificationService.ts    # Service de notifications
│   └── ...                       # Autres services
├── data/                         # Données statiques et mock
├── hooks/                        # Hooks React personnalisés
├── utils/                        # Utilitaires et helpers
├── assets/                       # Images et ressources statiques
└── src/                          # Backend API
    ├── controllers/              # Contrôleurs API
    ├── models/                   # Modèles de données
    ├── routes/                   # Routes API
    ├── middleware/               # Middlewares
    └── utils/                    # Utilitaires backend
```

## 🐛 Corrections récentes

### Bugs corrigés dans la dernière mise à jour :

✅ **Problèmes TypeScript** - Correction des types pour les refs, timers et composants
✅ **Erreurs de navigation** - Fix des problèmes de router et navigation
✅ **Context AppState** - Correction des calculs d'interactions et propriétés optionnelles  
✅ **Notifications Web** - Ajout des vérifications de sécurité pour l'API Notification
✅ **Gestion des refs** - Correction des références caméra et FlatList
✅ **Imports manquants** - Ajout des imports nécessaires
✅ **Vérifications nullish** - Amélioration de la robustesse du code
✅ **Admin forms** - Correction de la navigation dans les formulaires admin

## 🚧 État du développement

### ✅ Implémenté
- Interface utilisateur complète
- Système de navigation
- Gestion d'état global
- Composants d'administration
- Structure de l'API backend
- Tests unitaires (partiel)
- Documentation API
- Système de gamification avec niveaux et XP
- Journal intime avec réponses du compagnon
- Mini-jeux interactifs (Quiz, Memory Match)
- Calendrier de rendez-vous
- **🔒 Sécurité renforcée**:
  - Validation de mot de passe forte (8+ caractères, majuscules, minuscules, chiffres, caractères spéciaux)
  - Timeout de session avec auto-déconnexion (30 min d'inactivité par défaut)
  - Protection CSRF avec tokens
  - Audit logging pour opérations sensibles
  - Index de base de données pour performance optimale
- **⚡ Performance**:
  - Compression gzip des requêtes
  - Utilitaires de pagination
  - Skeleton loaders pour meilleure UX
  - Health check endpoints (/health, /health/detailed, /health/ready, /health/live)
- **🔧 DevOps**:
  - Docker et Docker Compose configurés
  - Pipeline CI/CD avec GitHub Actions
  - Configuration de tests automatisés
  - Métriques Prometheus disponibles
- **🎮 Features avancées**:
  - WebSocket pour chat en temps réel
  - Système de feature flags dynamique
  - Retour haptique pour interactions mobiles
  - Composants de chargement squelette

### 🔄 En cours
- Intégration AI réelle avec suivi des coûts
- Statistiques d'usage consultables via `aiUsage`
- Mécanisme de secours en cas d'indisponibilité du service AI
- Système de paiement (Stripe configuré)
- Notifications push
- Tests end-to-end
- Export GDPR des données utilisateur
- Modération de contenu
- Streaming de réponses AI

### 📋 À venir
- Déploiement production
- Migration PostgreSQL (préparée)
- Redis pour cache distribué
- Fonctionnalités AR avancées
- Deep linking configuration
- Support offline
- Widgets mobiles

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licences et crédits

- **Images** : Images de démonstration fournies par [Pexels](https://pexels.com)
- **Icônes** : [Lucide Icons](https://lucide.dev)
- **Framework** : [Expo](https://expo.dev) et [React Native](https://reactnative.dev)

## 🔗 Liens utiles

- [Documentation Expo](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [API Documentation](http://localhost:3000/api-docs) (en local)

## 🗄 Sauvegarde de la base de données

Pour créer une sauvegarde de la base SQLite, exécutez :

```bash
npm run backup
```

Les fichiers seront stockés dans le dossier `backups/` avec un horodatage.

Pour nettoyer les anciennes sessions expirées et archiver les données :

```bash
npm run cleanup
```

Les archives seront créées dans le dossier `archives/` au format JSON.

## 📚 Documentation Complète

### Guides Disponibles
- **[README.md](README.md)** - Vue d'ensemble et introduction
- **[IMPROVEMENTS.md](IMPROVEMENTS.md)** - Liste détaillée des 24 améliorations implémentées
- **[QUICK_START.md](docs/QUICK_START.md)** - Guide de démarrage rapide (5 minutes)
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Guide de déploiement en production
- **[PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md)** - Checklist pré-production complète
- **[API Documentation](http://localhost:3000/api-docs)** - Documentation Swagger interactive

### Démarrage Rapide

Si vous débutez, commencez par :
1. **[Guide de Démarrage Rapide](docs/QUICK_START.md)** - Installation en 5 minutes
2. **[Documentation API](http://localhost:3000/api-docs)** - Explorer les endpoints
3. **[IMPROVEMENTS.md](IMPROVEMENTS.md)** - Comprendre les fonctionnalités

### Déploiement Production

Pour déployer en production :
1. **[Guide de Déploiement](docs/DEPLOYMENT.md)** - Instructions pas-à-pas
2. **[Checklist Production](docs/PRODUCTION_CHECKLIST.md)** - Vérifications pré-lancement
3. **[.env.example](.env.example)** - Configuration complète

## 📞 Support

Pour obtenir de l'aide ou signaler des problèmes :
- **Issues GitHub** : Ouvrir une issue
- **Documentation** : Consulter les guides dans `/docs`
- **Email** : support@mysoulmate.app
- **Logs** : Vérifier les logs dans `/logs/`

---

<div align="center">
  <p>Développé avec ❤️ pour créer des expériences IA immersives</p>
</div>