# Architecture ell’o

## Vue d’ensemble

```text
Internet
  └── Nginx (80/443, TLS, CSP, rate limiting)
        └── Next.js 16 monolithique (port interne 3000)
              ├── Prisma ORM
              │     └── MySQL 8.4 (réseau Docker privé uniquement)
              ├── Google Calendar API (OAuth 2.0)
              ├── Stripe Checkout + webhooks
              └── SMTP ou Resend
```

L’application reste un monolithe modulaire. Les pages React, les Route Handlers, les règles métier et les intégrations externes vivent dans le même déploiement, tout en étant séparés par responsabilités.

## Modules principaux

- `app/(public)`: vitrine, prestations, galerie, contact et réservation.
- `app/admin`: interface d’administration protégée.
- `app/api`: API publique limitée, webhooks et API d’administration autorisée par rôle.
- `lib/booking`: calcul des créneaux, règles d’acompte et création atomique.
- `lib/auth`: sessions opaques en base et autorisation ADMIN/STAFF.
- `lib/calendar`, `lib/stripe`, `lib/email`: adaptateurs externes remplaçables.
- `prisma`: schéma, migration initiale et données de démonstration.
- `nginx`, `scripts`: reverse proxy, TLS et exploitation.

## Source de vérité et cohérence

MySQL est la source de vérité des rendez-vous. Google Calendar ne fournit que des indisponibilités et une copie synchronisée des rendez-vous.

La prévention des doubles réservations a deux niveaux :

1. recalcul serveur complet juste avant création ;
2. table `BookingSlot` par tranches de cinq minutes avec contrainte unique `(staffId, startsAt)` dans une transaction sérialisable.

Même si deux requêtes valident simultanément le même créneau, une seule peut insérer toutes ses unités d’occupation.

## Temps et fuseau horaire

Les instants sont stockés en UTC dans MySQL (`DateTime(3)`). Les horaires récurrents sont des minutes depuis minuit en heure locale. Toute conversion d’affichage ou de plage journalière utilise `Europe/Zurich`, y compris les changements heure d’été/hiver.

## Paiement

Une réservation avec acompte reste `PENDING_PAYMENT` et bloque temporairement le créneau. Seul un webhook Stripe signé peut passer le paiement à `PAID` et la réservation à `CONFIRMED`. Le retour navigateur n’a aucune autorité métier.

Le webhook revérifie l’identifiant Checkout, le montant, la devise, la durée du hold et la présence des unités d’occupation. Si le paiement arrive après expiration ou perte du créneau, l’application conserve la réservation expirée et demande un remboursement Stripe idempotent.

## Intégrations dégradées

- Google non connecté : la disponibilité MySQL fonctionne, sans indisponibilités externes.
- Google connecté mais indisponible : la recherche échoue fermée pour éviter une collision.
- Email indisponible : la réservation reste valide et l’échec est journalisé dans `EmailLog`.
- Rappels : une route cron authentifiée sélectionne les rendez-vous à J-1 ; le journal empêche les doublons.
- Stripe désactivé : les acomptes sont ignorés et les réservations sont confirmées sans paiement.

## Indexation

Les recherches de disponibilité utilisent les index temporels de `Booking`, `StaffTimeOff` et `BookingSlot`. Les clés Stripe, mappings Calendar, clients et états opérationnels disposent d’index dédiés dans `schema.prisma`.
