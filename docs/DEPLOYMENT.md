# MySoulmate - Guide de Déploiement

Ce guide explique comment déployer MySoulmate en production.

## Table des Matières

- [Pré-requis](#pré-requis)
- [Déploiement avec Docker](#déploiement-avec-docker)
- [Déploiement Manuel](#déploiement-manuel)
- [Configuration Production](#configuration-production)
- [Base de Données](#base-de-données)
- [Monitoring](#monitoring)
- [Maintenance](#maintenance)
- [Troubleshooting](#troubleshooting)

---

## Pré-requis

### Serveur
- **OS**: Ubuntu 20.04+ ou équivalent
- **CPU**: 2+ cores
- **RAM**: 4GB minimum, 8GB recommandé
- **Stockage**: 20GB minimum
- **Réseau**: Ports 80, 443, 3000 ouverts

### Services Requis
- Node.js 16+ (18 recommandé)
- PostgreSQL 13+ (recommandé) ou SQLite
- Redis 6+ (optionnel mais recommandé)
- Nginx (pour reverse proxy)
- SSL Certificate (Let's Encrypt)

### Services Tiers
- OpenAI API Key (pour fonctionnalités IA)
- Stripe Account (pour paiements)
- AWS S3 ou équivalent (pour stockage fichiers)

---

## Déploiement avec Docker

### Option Recommandée

#### 1. Cloner le repository
```bash
git clone https://github.com/yourusername/mysoulmate.git
cd mysoulmate
```

#### 2. Configurer l'environnement
```bash
cp .env.example .env
nano .env  # Éditer avec vos valeurs
```

Variables critiques à configurer:
```env
NODE_ENV=production
JWT_SECRET=<générer_avec_openssl_rand_-hex_32>
OPENAI_API_KEY=<votre_clé>
STRIPE_SECRET_KEY=<votre_clé>

# PostgreSQL
DB_TYPE=postgres
DB_HOST=postgres
DB_NAME=mysoulmate
DB_USER=mysoulmate
DB_PASSWORD=<mot_de_passe_fort>

# Redis
REDIS_ENABLED=true
REDIS_HOST=redis
```

#### 3. Configurer Docker Compose
Éditer `docker-compose.yml` si nécessaire:
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: mysoulmate
      POSTGRES_USER: mysoulmate
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
    restart: unless-stopped

volumes:
  postgres-data:
  redis-data:
```

#### 4. Démarrer les services
```bash
# Build et démarrage
docker-compose up -d

# Vérifier les logs
docker-compose logs -f api

# Vérifier le statut
curl http://localhost:3000/health
```

#### 5. Configurer Nginx (reverse proxy)
Créer `/etc/nginx/sites-available/mysoulmate`:
```nginx
server {
    listen 80;
    server_name api.mysoulmate.app;

    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name api.mysoulmate.app;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Health checks (no auth required)
    location /health {
        proxy_pass http://localhost:3000;
        access_log off;
    }
}
```

#### 6. Configurer SSL avec Let's Encrypt
```bash
# Installer certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir certificat
sudo certbot --nginx -d api.mysoulmate.app

# Auto-renouvellement (déjà configuré)
sudo certbot renew --dry-run
```

---

## Déploiement Manuel

### 1. Préparer le serveur
```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Installer PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Installer Redis
sudo apt install -y redis-server

# Installer Nginx
sudo apt install -y nginx
```

### 2. Configurer PostgreSQL
```bash
sudo -u postgres psql

CREATE DATABASE mysoulmate;
CREATE USER mysoulmate WITH ENCRYPTED PASSWORD 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON DATABASE mysoulmate TO mysoulmate;
\q
```

### 3. Déployer l'application
```bash
# Créer utilisateur système
sudo useradd -m -s /bin/bash mysoulmate
sudo su - mysoulmate

# Cloner et configurer
git clone https://github.com/yourusername/mysoulmate.git
cd mysoulmate
npm install --production

# Configurer .env
cp .env.example .env
nano .env

# Build si nécessaire
npm run build
```

### 4. Configurer PM2 (Process Manager)
```bash
# Installer PM2
npm install -g pm2

# Démarrer l'application
pm2 start server.js --name mysoulmate-api

# Configurer démarrage automatique
pm2 startup
pm2 save

# Commandes utiles
pm2 status
pm2 logs mysoulmate-api
pm2 restart mysoulmate-api
pm2 monit
```

---

## Configuration Production

### Checklist de Sécurité

#### Variables d'Environnement
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` : Généré avec `openssl rand -hex 32`
- [ ] `DB_PASSWORD` : Mot de passe fort
- [ ] `REDIS_PASSWORD` : Si Redis utilisé
- [ ] Tous les secrets configurés

#### Base de Données
- [ ] PostgreSQL configuré (pas SQLite)
- [ ] Backups automatiques configurés
- [ ] SSL activé pour connexions DB
- [ ] Connection pooling configuré

#### Réseau
- [ ] Firewall configuré (ufw)
- [ ] Ports non-essentiels fermés
- [ ] Fail2ban installé
- [ ] DDoS protection active

#### Application
- [ ] Rate limiting activé
- [ ] CORS configuré correctement
- [ ] Logging en production
- [ ] Monitoring actif
- [ ] Health checks fonctionnels

#### SSL/TLS
- [ ] Certificat SSL installé
- [ ] HTTPS forcé
- [ ] HSTS activé
- [ ] Certificats auto-renouvelés

---

## Base de Données

### Migration SQLite → PostgreSQL

#### 1. Export depuis SQLite
```bash
npm run backup
```

#### 2. Configurer PostgreSQL dans .env
```env
DB_TYPE=postgres
DB_HOST=localhost
DB_NAME=mysoulmate
DB_USER=mysoulmate
DB_PASSWORD=votre_mot_de_passe
```

#### 3. Redémarrer l'application
```bash
pm2 restart mysoulmate-api
# Les tables seront créées automatiquement
```

#### 4. Import des données (si nécessaire)
Utiliser un outil comme `pgloader` pour migration complexe

### Backups Automatiques

#### Script de backup
Créer `/opt/mysoulmate/backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mysoulmate"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup PostgreSQL
pg_dump -U mysoulmate mysoulmate | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Backup fichiers
tar -czf "$BACKUP_DIR/files_$DATE.tar.gz" /path/to/uploads

# Nettoyer anciens backups (garder 30 jours)
find $BACKUP_DIR -type f -mtime +30 -delete
```

#### Configurer cron
```bash
sudo crontab -e

# Backup quotidien à 2h du matin
0 2 * * * /opt/mysoulmate/backup.sh
```

---

## Monitoring

### Health Checks

#### Endpoint de santé
```bash
# Check basique
curl https://api.mysoulmate.app/health

# Check détaillé
curl https://api.mysoulmate.app/health/detailed
```

#### Monitoring automatique avec UptimeRobot
1. Créer compte sur UptimeRobot
2. Ajouter monitor HTTP(S)
3. URL: `https://api.mysoulmate.app/health`
4. Interval: 5 minutes
5. Notifications par email/SMS

### Métriques Prometheus

#### Installer Prometheus
```bash
# Télécharger et installer
wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz
tar xvfz prometheus-*.tar.gz
cd prometheus-*
```

#### Configuration prometheus.yml
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'mysoulmate-api'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
```

### Logs

#### Centralisation avec Loki (optionnel)
```bash
# Installer Promtail pour collecter logs
# Installer Loki pour stocker logs
# Visualiser dans Grafana
```

#### Logs simples
```bash
# Voir logs PM2
pm2 logs mysoulmate-api

# Logs application
tail -f /path/to/logs/app.log

# Logs Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## Maintenance

### Mise à jour de l'application

#### Avec Docker
```bash
cd /path/to/mysoulmate
git pull origin main
docker-compose build
docker-compose up -d
```

#### Manuel avec PM2
```bash
cd /path/to/mysoulmate
git pull origin main
npm install --production
pm2 restart mysoulmate-api
```

### Mode Maintenance

#### Activer
```bash
# Dans .env
MAINTENANCE_MODE=true
MAINTENANCE_MESSAGE="Maintenance en cours, retour prévu à 14h"

# Redémarrer
pm2 restart mysoulmate-api
```

### Nettoyage Base de Données
```bash
# Exécuter script de nettoyage
npm run cleanup

# Nettoyer sessions expirées, anciens logs, etc.
```

---

## Troubleshooting

### Problèmes Courants

#### L'API ne répond pas
```bash
# Vérifier statut
pm2 status
pm2 logs mysoulmate-api --lines 100

# Vérifier port
sudo netstat -tulpn | grep 3000

# Vérifier processus
ps aux | grep node
```

#### Base de données inaccessible
```bash
# Vérifier PostgreSQL
sudo systemctl status postgresql

# Tester connexion
psql -U mysoulmate -d mysoulmate -h localhost

# Vérifier logs
sudo tail -f /var/log/postgresql/postgresql-13-main.log
```

#### Redis problème
```bash
# Vérifier Redis
sudo systemctl status redis

# Tester connexion
redis-cli ping

# Vérifier logs
sudo tail -f /var/log/redis/redis-server.log
```

#### Certificat SSL expiré
```bash
# Renouveler manuellement
sudo certbot renew

# Vérifier auto-renouvellement
sudo systemctl status certbot.timer
```

### Performance Issues

#### CPU élevé
- Activer Redis caching
- Optimiser requêtes DB
- Augmenter worker processes

#### Mémoire élevée
- Augmenter RAM serveur
- Configurer memory limits
- Redémarrer périodiquement

#### Requêtes lentes
- Analyser slow query logs
- Ajouter indexes DB
- Activer caching
- CDN pour assets statiques

---

## Support

Pour toute question ou problème:
- Documentation: https://docs.mysoulmate.app
- Issues: https://github.com/yourusername/mysoulmate/issues
- Email: support@mysoulmate.app

---

**Dernière mise à jour**: 2025-01-14
**Version**: 1.0.0
