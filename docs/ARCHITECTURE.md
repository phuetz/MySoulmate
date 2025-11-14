# Architecture MySoulmate

## Vue d'ensemble

MySoulmate est une application mobile d'IA compagnon construite avec une architecture client-serveur moderne.

## Stack Technique

### Frontend (Mobile)
- **Framework**: React Native avec Expo
- **Routing**: Expo Router (file-based routing)
- **State Management**: Context API (AppStateContext, AuthContext, ThemeContext)
- **Styling**: NativeWind (Tailwind pour React Native)
- **Storage Local**: AsyncStorage
- **HTTP Client**: Axios

### Backend (API)
- **Runtime**: Node.js
- **Framework**: Express.js v4
- **Database**: SQLite (développement), migration vers PostgreSQL prévue
- **ORM**: Sequelize v6
- **Authentication**: JWT avec refresh tokens
- **Validation**: express-validator
- **Documentation**: Swagger/OpenAPI 3.0

### Services Externes
- **IA**: OpenAI API (GPT-3.5-turbo)
- **Paiements**: Stripe
- **Notifications**: Expo Push Notifications
- **Email**: SendGrid/AWS SES (configurable)

## Architecture Système

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (React Native/Expo)              │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Screens    │  │  Components  │  │   Context    │      │
│  │  (14 tabs)   │  │   (Reusable) │  │ (Auth, App)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│           │                │                  │              │
│           └────────────────┴──────────────────┘              │
│                          │                                    │
│                   ┌──────▼──────┐                            │
│                   │   Services  │                            │
│                   │  (API calls)│                            │
│                   └──────┬──────┘                            │
└──────────────────────────┼──────────────────────────────────┘
                           │ HTTPS/REST
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    BACKEND (Express.js)                      │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Middleware Layer                         │  │
│  │  • CORS • Helmet • Rate Limiting • Auth • CSRF       │  │
│  │  • IP Filter • Compression • Body Parser             │  │
│  └───────────────────────┬──────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────▼──────────────────────────────┐  │
│  │              Routes Layer (Versioned)                 │  │
│  │  /api/v1/* - Auth, Users, Companions, Gifts, etc.    │  │
│  └───────────────────────┬──────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────▼──────────────────────────────┐  │
│  │            Controllers Layer                          │  │
│  │  Business logic, validation, error handling           │  │
│  └───────────────────────┬──────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────▼──────────────────────────────┐  │
│  │              Models Layer (Sequelize)                 │  │
│  │  User, Companion, Gift, Message, Session, etc.       │  │
│  └───────────────────────┬──────────────────────────────┘  │
└──────────────────────────┼──────────────────────────────────┘
                           │
               ┌───────────┴───────────┐
               │                       │
       ┌───────▼────────┐     ┌───────▼────────┐
       │   SQLite DB    │     │  External APIs  │
       │  (Production:  │     │  • OpenAI       │
       │   PostgreSQL)  │     │  • Stripe       │
       └────────────────┘     │  • SendGrid     │
                              └─────────────────┘
```

## Structure des Dossiers

```
MySoulmate/
├── app/                    # Frontend Expo
│   ├── (tabs)/            # Écrans avec navigation par onglets
│   ├── admin/             # Panel administrateur
│   ├── auth/              # Authentification (login, register)
│   └── product/           # Écrans de produits
│
├── src/                   # Backend API
│   ├── controllers/       # Logique métier
│   ├── models/           # Modèles Sequelize
│   ├── routes/           # Définition des routes
│   ├── middleware/       # Middlewares Express
│   ├── utils/            # Fonctions utilitaires
│   └── config/           # Configuration
│
├── components/           # Composants React réutilisables
├── context/             # Providers React Context
├── services/            # Services frontend (API calls)
├── hooks/               # Custom React hooks
├── utils/               # Utilitaires frontend
├── data/                # Données mock/statiques
└── __tests__/           # Tests
```

## Flux de Données

### Authentification

```
1. User → Login Form
2. Frontend → POST /api/v1/auth/login
3. Backend → Validate credentials
4. Backend → Generate JWT + Refresh Token
5. Backend → Create Session
6. Backend → Return tokens
7. Frontend → Store in AsyncStorage
8. Frontend → Set Authorization header for future requests
```

### Interaction avec l'IA

```
1. User → Send message
2. Frontend → POST /api/v1/messages
3. Backend → Check cache
4. Backend → Call OpenAI API (if not cached)
5. Backend → Analyze sentiment
6. Backend → Update companion affection
7. Backend → Save message + response
8. Backend → Return response
9. Frontend → Display in chat
```

### Paiements

```
1. User → Select subscription plan
2. Frontend → POST /api/v1/checkout
3. Backend → Create Stripe session
4. Backend → Return session URL
5. Frontend → Redirect to Stripe
6. User → Complete payment
7. Stripe → Webhook to backend
8. Backend → Update user subscription
9. Backend → Send confirmation email
```

## Sécurité

### Couches de Sécurité

1. **Transport**: HTTPS enforcement
2. **Headers**: Helmet + custom security headers
3. **Authentication**: JWT avec rotation de tokens
4. **Authorization**: Role-based access control
5. **Rate Limiting**: Par IP et par utilisateur
6. **Input Validation**: express-validator + sanitization
7. **CSRF Protection**: Token-based
8. **Encryption**: AES-256-CBC avec IV aléatoires
9. **SQL Injection**: Sequelize ORM avec prepared statements
10. **XSS**: xss-clean middleware

### Secrets Management

Toutes les clés sensibles sont stockées dans des variables d'environnement:
- JWT_SECRET
- PAYMENT_SECRET
- OPENAI_API_KEY
- STRIPE_SECRET_KEY
- Database credentials

Validation au démarrage pour s'assurer que toutes les variables requises sont définies.

## Performance

### Optimisations

- **Compression**: gzip/brotli pour les réponses
- **Caching**: Réponses AI en cache (5 min TTL)
- **Pagination**: Sur toutes les listes (limite max: 100)
- **Lazy Loading**: Images et composants
- **Connection Pooling**: Base de données
- **Rate Limiting**: Prévention de la surcharge

### Monitoring

- Express Status Monitor (`/status`)
- Prometheus metrics (`/metrics`)
- Winston logging structuré
- Sentry pour error tracking (à configurer)

## Évolutivité

### Migrations Prévues

1. **Database**: SQLite → PostgreSQL
2. **Cache**: In-memory → Redis
3. **Queue**: None → Bull + Redis
4. **Storage**: Local → AWS S3
5. **Deployment**: Manual → Docker + CI/CD

### Architecture Future (Microservices)

```
API Gateway
    ├── Auth Service
    ├── User Service
    ├── Companion Service
    ├── AI Service
    ├── Payment Service
    └── Notification Service
```

## API Versioning

L'API utilise un système de versioning dans l'URL:
- `/api/v1/*` - Version actuelle
- Support de plusieurs versions simultanées
- Dépréciation progressive des anciennes versions

## Tests

### Types de Tests

- **Unit Tests**: Controllers, models, utils
- **Integration Tests**: API endpoints
- **E2E Tests**: User flows complets
- **Performance Tests**: Load testing

### Couverture Cible

- **Backend**: >80%
- **Frontend Components**: >70%
- **Critical Paths**: 100%

## Déploiement

### Environnements

1. **Development**: Local avec SQLite
2. **Staging**: Cloud avec PostgreSQL
3. **Production**: Cloud avec HA setup

### CI/CD Pipeline (à implémenter)

```
1. Git Push
2. GitHub Actions
3. Lint + Tests
4. Build
5. Security Scan
6. Deploy to Staging
7. Automated Tests
8. Manual Approval
9. Deploy to Production
10. Health Checks
11. Rollback si échec
```

## Documentation

- **API Docs**: Swagger UI disponible sur `/api-docs`
- **Code Docs**: JSDoc dans le code
- **Architecture**: Ce fichier
- **Guides**: CONTRIBUTING.md, DEPLOYMENT.md (à créer)

## Décisions Techniques (ADR)

Les décisions d'architecture majeures sont documentées dans `/docs/adr/`

## Contact & Support

Pour questions sur l'architecture:
- Ouvrir une issue sur GitHub
- Consulter la documentation Swagger
- Vérifier les logs Winston
