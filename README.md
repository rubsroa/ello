# ell’o — Coiffure · Genève

Application web complète pour un salon de coiffure femme/homme : site public, réservation atomique, administration, clients, galerie, Google Calendar, Stripe optionnel, emails et déploiement Docker sur VPS.

## Stack

- Next.js 16.3, React 19 et TypeScript strict ;
- Tailwind CSS 4 et composants accessibles inspirés de shadcn/ui ;
- MySQL 8.4 et Prisma 6 ;
- Vitest, Testing Library et Playwright ;
- Docker Compose, Nginx et Certbot.

Voir [ARCHITECTURE.md](ARCHITECTURE.md), [SECURITY.md](SECURITY.md) et [DEPLOYMENT.md](DEPLOYMENT.md).

## Installation locale

Prérequis : Node.js 22, npm et MySQL 8.x, ou Docker.

```bash
npm ci
cp .env.example .env
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Le seed exige `DEV_ADMIN_PASSWORD` avec au moins 14 caractères. Il crée les catégories, prestations, trois membres, horaires, galerie et trois rendez-vous de démonstration. Il est idempotent. Les prix, durées, membres et horaires sont stockés en base et administrables.

Avec Docker :

```bash
docker compose up -d db
docker compose run --rm app npx prisma migrate deploy
docker compose run --rm app npm run db:seed
docker compose up app
```

## Scripts de qualité

```bash
npm run lint
npm run typecheck
npm run test
RUN_DB_TESTS=true npm run test
npm run build
npm run test:e2e
npm run prisma:validate
```

Les tests d’intégration MySQL sont activés avec `RUN_DB_TESTS=true` afin que les tests unitaires restent exécutables sans infrastructure. Ils créent et nettoient leurs propres réservations.

## Flux de réservation

Le tunnel interroge les prestations et disponibilités réelles. Les horaires salon/personnel, pauses, absences, rendez-vous, marges, délai minimal, horizon maximal et événements Google sont combinés en UTC avec affichage `Europe/Zurich`.

Une vérification serveur précède chaque création. `BookingSlot` garantit ensuite au niveau MySQL qu’aucun même coiffeur ne peut occuper deux rendez-vous sur une tranche de cinq minutes.

## Administration

`/admin` utilise des sessions opaques en base et les rôles `ADMIN`/`STAFF`. Les fonctionnalités comprennent dashboard, planning, catégories/prestations, équipe et affectations, horaires/absences, clients, messages de contact, galerie, paiements, réglages, OAuth Google et journal d’audit.

## Intégrations

- Google Calendar : renseigner les variables OAuth puis connecter chaque membre dans l’admin.
- Stripe : désactivé par défaut. Le webhook signé est l’unique source de confirmation du paiement.
- Email : choisir `smtp` ou `resend` avec `EMAIL_PROVIDER`; les confirmations, modifications, annulations, notifications salon et rappels sont journalisés et idempotents. Définir `SALON_NOTIFICATION_EMAIL` et appeler le cron protégé `/api/cron/reminders` chaque heure.

Voir `.env.example` pour la liste complète des variables.

## Production

MySQL ne publie aucun port dans la composition de production. Nginx termine TLS, applique les headers de sécurité et limite les endpoints sensibles. Les uploads et données MySQL utilisent des volumes persistants.

La procédure HTTPS, la migration sans perte, les sauvegardes, la restauration et le dépannage se trouvent dans [DEPLOYMENT.md](DEPLOYMENT.md).

## Dépannage

- `P1001` Prisma : vérifier l’hôte MySQL, le healthcheck et `DATABASE_URL`.
- Aucun créneau : vérifier horaires, affectations `StaffService`, absences et connexion Google.
- Webhook Stripe refusé : vérifier le corps brut, le endpoint secret et l’URL HTTPS.
- Google sans refresh token : révoquer l’accès puis reconnecter avec `prompt=consent`.
- Images uploadées absentes après redéploiement : vérifier le volume `uploads` monté sur `/app/public/uploads`.

## Assets

Les photographies de démonstration sont téléchargées localement depuis Pexels dans `public/images`. Les dossiers de variantes officielles du logo sont prêts sous `public/logos`; aucun fichier de logo officiel n’était présent dans le dépôt initial, le mot-signe est donc rendu typographiquement sans altérer un asset inexistant.
