# Sécurité

## Signaler une vulnérabilité

Ne publiez pas de vulnérabilité contenant des données client dans une issue publique. Contactez l’exploitant du salon par un canal privé et fournissez : version concernée, scénario reproductible, impact et correctif suggéré. Les secrets ou données réelles doivent être expurgés.

## Modèle de menace

Actifs prioritaires : rendez-vous, coordonnées client, sessions d’administration, tokens Google, secrets Stripe/SMTP et sauvegardes MySQL.

Adversaires considérés : visiteur automatisé, client tentant de réserver deux fois, attaquant disposant d’un compte STAFF, compromission d’un webhook ou OAuth, upload malveillant et fuite de sauvegarde.

Frontières de confiance : navigateur ↔ Nginx, Nginx ↔ Next.js, Next.js ↔ MySQL et Next.js ↔ fournisseurs externes.

## Contrôles implémentés

- validation Zod dans les Route Handlers ;
- Prisma uniquement pour les données métier ;
- sessions opaques aléatoires, hachées en base, révocables et limitées à sept jours ;
- cookies `HttpOnly`, `SameSite=Lax`, `Secure` en production ;
- contrôles de rôle au plus près des données et dans chaque mutation admin ;
- comparaison bcrypt avec hash factice pour réduire l’énumération de comptes ;
- rate limiting applicatif et Nginx sur login, contact et réservation ;
- vérification d’origine sur les mutations de navigateur ;
- transaction sérialisable et contrainte SQL contre le double booking ;
- signature du webhook Stripe vérifiée sur le corps brut ;
- cohérence session/montant/devise/expiration revérifiée dans la transaction webhook ; un paiement reçu après expiration est remboursé automatiquement avec une clé d’idempotence ;
- état OAuth Google signé, court et lié à la session ;
- tokens Google chiffrés AES-256-GCM avant stockage ;
- uploads limités, type réel détecté par magic bytes, noms aléatoires et extensions imposées ;
- journaux sans mot de passe, token, contenu de carte ni secret ;
- headers Nginx : CSP, HSTS, anti-framing, nosniff, referrer et permissions policy ;
- MySQL sans port publié en production ;
- conteneurs sans privilèges supplémentaires et application non-root.
- adresse cliente acceptée depuis `X-Real-IP` uniquement derrière Nginx, qui écrase les headers transmis par le navigateur ;
- transitions de statut explicites : un compte STAFF ne peut ni confirmer un acompte en attente ni ressusciter un rendez-vous terminal ;
- rapprochement client public par paire email/téléphone exacte, sans écrasement d’une fiche existante ;
- sauvegardes locales générées avec des droits `0600`.

## Revue du 26 août 2026

Le scan statique de sécurité a relevé six scénarios (trois moyens, trois faibles). Tous ont été corrigés et couverts par tests ciblés : paiement tardif, transition de statut STAFF, écrasement client, métriques STAFF, spoofing d’adresse proxy et permissions des sauvegardes. Les intégrations Google/Stripe restent à valider une dernière fois avec de vrais comptes de recette avant ouverture publique.

## Points d’exploitation obligatoires

1. Générer `AUTH_SECRET`, `ENCRYPTION_KEY` et mots de passe avec un CSPRNG ; ne jamais réutiliser les exemples.
2. Restreindre SSH par clé et pare-feu ; n’exposer que 80, 443 et le port SSH choisi.
3. Activer HSTS uniquement après validation complète de HTTPS et des sous-domaines.
4. Chiffrer les sauvegardes hors serveur et tester une restauration chaque trimestre.
5. Révoquer immédiatement les sessions et secrets après suspicion de fuite.
6. Configurer des alertes sur échecs de login, webhooks invalides et erreurs de synchronisation.

## CSP

La CSP Nginx autorise actuellement les styles et scripts inline nécessaires au rendu Next.js et à Stripe. Un durcissement par nonce par requête est recommandé lorsque la configuration CSP dynamique est introduite ; ne pas retirer la CSP existante entre-temps.

## Données et conservation

Les données de réservation ne doivent pas être utilisées pour le marketing sans consentement séparé. L’action d’anonymisation supprime les coordonnées tout en conservant les montants et historiques nécessaires. La durée opérationnelle et légale exacte doit être validée avec le responsable du salon avant production.
