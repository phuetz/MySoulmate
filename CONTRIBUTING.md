# Guide de Contribution - MySoulmate

Merci de votre intérêt pour contribuer à MySoulmate ! Ce guide vous aidera à démarrer.

## Table des Matières

1. [Code de Conduite](#code-de-conduite)
2. [Comment Contribuer](#comment-contribuer)
3. [Configuration de l'Environnement](#configuration-de-lenvironnement)
4. [Standards de Code](#standards-de-code)
5. [Processus de Pull Request](#processus-de-pull-request)
6. [Tests](#tests)
7. [Documentation](#documentation)

## Code de Conduite

En participant à ce projet, vous acceptez de respecter notre code de conduite. Soyez respectueux, inclusif et professionnel.

## Comment Contribuer

### Signaler un Bug

1. Vérifiez si le bug n'a pas déjà été signalé dans les Issues
2. Créez une nouvelle issue avec le template "Bug Report"
3. Incluez:
   - Description détaillée du problème
   - Étapes pour reproduire
   - Comportement attendu vs réel
   - Screenshots si applicable
   - Environnement (OS, version Node.js, etc.)

### Proposer une Fonctionnalité

1. Créez une issue avec le template "Feature Request"
2. Décrivez clairement:
   - Le problème que ça résout
   - La solution proposée
   - Des alternatives considérées
   - Impact sur le code existant

### Soumettre du Code

1. Forkez le repository
2. Créez une branche depuis `main`:
   ```bash
   git checkout -b feature/ma-nouvelle-fonctionnalite
   ```
3. Faites vos modifications
4. Committez avec des messages clairs
5. Poussez vers votre fork
6. Ouvrez une Pull Request

## Configuration de l'Environnement

### Prérequis

- Node.js >= 14.x
- npm >= 6.x
- Git
- Expo CLI (pour le frontend mobile)

### Installation

```bash
# Cloner le repository
git clone https://github.com/votre-username/MySoulmate.git
cd MySoulmate

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Éditer .env avec vos clés
nano .env

# Initialiser la base de données
npm run dev  # Démarre en mode développement
```

### Variables d'Environnement

Référez-vous à `.env.example` pour toutes les variables requises. Les variables **obligatoires** sont:
- `JWT_SECRET` (min 32 caractères)
- `PAYMENT_SECRET` (min 32 caractères)
- `PORT`

## Standards de Code

### Style JavaScript

Nous utilisons ESLint et Prettier pour maintenir la cohérence du code.

```bash
# Vérifier le linting
npm run lint

# Formater automatiquement
npm run format  # (à ajouter dans package.json)
```

### Règles Principales

- **Indentation**: 2 espaces
- **Quotes**: Single quotes
- **Semi-colons**: Obligatoires
- **Max line length**: 100 caractères
- **Trailing commas**: Aucune
- **Arrow functions**: Préférées pour les callbacks
- **Const/Let**: Pas de `var`
- **Template literals**: Préférés pour la concaténation

### Conventions de Nommage

```javascript
// Variables et fonctions: camelCase
const userName = 'John';
function getUserById(id) { ... }

// Classes et composants React: PascalCase
class UserModel { ... }
function MyComponent() { ... }

// Constantes: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';

// Fichiers:
// - Components: PascalCase (MyComponent.tsx)
// - Utils/Helpers: camelCase (formatDate.js)
// - Constants: UPPER_SNAKE_CASE (API_CONSTANTS.js)
```

### Structure des Commits

Utilisez des messages de commit conventionnels:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation
- `style`: Formatage (ne change pas le code)
- `refactor`: Refactoring
- `test`: Ajout/modification de tests
- `chore`: Tâches de maintenance

**Exemples:**

```
feat(auth): add 2FA support

Implement two-factor authentication using TOTP.
Users can now enable 2FA in settings.

Closes #123

fix(api): prevent race condition in token refresh

The refresh token endpoint had a race condition when
multiple requests were made simultaneously.

refactor(database): migrate to PostgreSQL

- Update Sequelize configuration
- Add migration scripts
- Update documentation

BREAKING CHANGE: SQLite is no longer supported
```

### JSDoc

Documentez toutes les fonctions publiques:

```javascript
/**
 * Retrieve user by ID
 * @param {number} id - User ID
 * @param {Object} options - Query options
 * @param {boolean} options.includeDeleted - Include soft-deleted users
 * @returns {Promise<User|null>} User object or null if not found
 * @throws {ValidationError} If ID is invalid
 */
async function getUserById(id, options = {}) {
  // ...
}
```

## Processus de Pull Request

### Avant de Soumettre

- [ ] Code suit les standards de style
- [ ] Tous les tests passent
- [ ] Nouveaux tests ajoutés pour la nouvelle fonctionnalité
- [ ] Documentation mise à jour
- [ ] Pas de `console.log` oubliés
- [ ] Branch à jour avec `main`

### Template de PR

```markdown
## Description
Brève description des changements

## Type de Changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalité
- [ ] Breaking change
- [ ] Documentation

## Comment Tester
1. Étape 1
2. Étape 2
3. ...

## Checklist
- [ ] Tests ajoutés/mis à jour
- [ ] Documentation mise à jour
- [ ] Pas de régression
- [ ] Code review effectué

## Screenshots
(si applicable)

## Issues Liées
Closes #123
```

### Review Process

1. Au moins 1 approbation requise
2. Tous les tests CI doivent passer
3. Pas de conflits avec `main`
4. Code review complet effectué

## Tests

### Lancer les Tests

```bash
# Tous les tests
npm test

# Tests spécifiques
npm test -- auth.test.js

# Avec couverture
npm test -- --coverage

# En mode watch
npm test -- --watch
```

### Écrire des Tests

```javascript
describe('User Authentication', () => {
  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'wrong' });

    expect(res.status).toBe(401);
  });
});
```

### Couverture de Tests

Maintenir au minimum:
- **Backend**: 80% de couverture
- **Frontend**: 70% de couverture
- **Fonctions critiques**: 100%

## Documentation

### Code Documentation

- Utilisez JSDoc pour toutes les fonctions publiques
- Commentez la logique complexe
- Gardez les commentaires à jour
- Évitez les commentaires évidents

### Documentation API

- Swagger/OpenAPI pour tous les endpoints
- Exemples de requêtes/réponses
- Description des codes d'erreur
- Schémas de validation

### README et Guides

- Mettre à jour README.md si nécessaire
- Documenter les nouvelles features dans docs/
- Créer des guides pour les fonctionnalités complexes

## Ressources

- [Documentation React Native](https://reactnative.dev/)
- [Documentation Expo](https://docs.expo.dev/)
- [Documentation Express.js](https://expressjs.com/)
- [Documentation Sequelize](https://sequelize.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)

## Questions?

- Ouvrez une issue avec le label "question"
- Consultez la documentation existante
- Vérifiez les issues fermées

## Remerciements

Merci à tous les contributeurs qui aident à améliorer MySoulmate !
