# Déploiement sur VPS Debian

## Prérequis

- VPS Debian compatible avec Docker Engine et Compose v2 ;
- DNS `A`/`AAAA` du domaine pointant vers le VPS ;
- ports 80 et 443 ouverts, MySQL non exposé ;
- au moins 2 Go de RAM, stockage surveillé et destination de sauvegarde hors VPS.

Debian 12 est recommandé. Debian Bullseye reste possible si les versions Docker supportées y sont disponibles.

## Préparation

```bash
git clone https://github.com/rubsroa/ello.git
cd ello
cp .env.example .env
openssl rand -hex 32
```

Renseigner tous les secrets dans `.env`, notamment `MYSQL_*`, `AUTH_SECRET`, `ENCRYPTION_KEY`, `APP_URL=https://votre-domaine` et `DOMAIN`. Ne jamais committer ce fichier.

## Construction, migration et démarrage

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d db
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm app npx prisma migrate deploy
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d app
```

Le seed est réservé à une installation de démonstration. Il exige `DEV_ADMIN_PASSWORD` d’au moins 14 caractères :

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm app npm run db:seed
```

En production réelle, créer le premier administrateur par une procédure contrôlée puis supprimer les variables `DEV_ADMIN_*`.

## Certificat initial

Après propagation DNS :

```bash
export DOMAIN=ello-coiffure.ch
export LETSENCRYPT_EMAIL=admin@example.ch
./scripts/bootstrap-certbot.sh
```

Le script démarre d’abord la configuration HTTP ACME, obtient le certificat, puis recrée Nginx avec redirection HTTPS. Vérifier le certificat et le site avant d’ajouter HSTS à des sous-domaines supplémentaires.

Renouvellement quotidien via cron ou timer systemd :

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm --profile certbot certbot renew --webroot -w /var/www/certbot
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec nginx nginx -s reload
```

## Google Calendar

Dans Google Cloud Console : créer un client OAuth Web, activer Calendar API et déclarer exactement `https://DOMAIN/api/integrations/google/callback`. Fournir `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` et `GOOGLE_REDIRECT_URI`, puis connecter chaque membre depuis Administration → Équipe.

## Stripe

Configurer `STRIPE_SECRET_KEY`, la clé publique et un webhook HTTPS vers `/api/stripe/webhook`. Souscrire au minimum à `checkout.session.completed`. Copier le secret de signature dans `STRIPE_WEBHOOK_SECRET`, puis définir `STRIPE_ENABLED=true` et activer les paiements dans les réglages admin.

## Email et rappels

Pour SMTP, renseigner `SMTP_HOST`, port, sécurité et identifiants. Pour Resend, utiliser `EMAIL_PROVIDER=resend` et `RESEND_API_KEY`. Définir `SALON_NOTIFICATION_EMAIL` pour les notifications internes et générer un `CRON_SECRET` aléatoire d’au moins 32 octets. Vérifier SPF, DKIM et DMARC du domaine expéditeur avant ouverture au public.

Déclencher les rappels une fois par heure depuis le cron du VPS :

```bash
curl --fail --silent --show-error --request POST \
  --header "Authorization: Bearer $CRON_SECRET" \
  "https://$DOMAIN/api/cron/reminders"
```

La sélection couvre les rendez-vous confirmés prévus dans 23 à 25 heures. `EmailLog` empêche un second envoi après succès.

## Sauvegarde et restauration

Sauvegarde quotidienne :

```bash
BACKUP_DIR=/srv/backups/ello BACKUP_RETENTION_DAYS=14 ./scripts/backup-db.sh
```

Pour l'automatiser à 02:15 UTC avec une rétention locale de 14 jours :

```bash
sudo install -m 0644 deploy/ello-backup.cron /etc/cron.d/ello-backup
sudo install -d -m 0700 /srv/backups/ello
sudo /srv/ello/scripts/backup-db.sh
```

Copier ensuite le fichier chiffré vers un stockage hors VPS. Une sauvegarde n’est validée qu’après restauration sur une instance isolée :

```bash
./scripts/restore-db.sh /srv/backups/ello/salon-YYYYMMDDTHHMMSSZ.sql.gz
```

Le script exige une confirmation explicite, vérifie l’archive puis exécute `mysqlcheck`. Les dumps sont créés avec `umask 077` et forcés en mode `0600` ; leur chiffrement avant copie hors VPS reste obligatoire.

## Mise à jour

```bash
git pull --ff-only
docker compose -f docker-compose.yml -f docker-compose.prod.yml build app
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm app npx prisma migrate deploy
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d app nginx
```

Toujours sauvegarder avant migration et vérifier `/api/health`, une recherche de disponibilité et le login admin après déploiement.
