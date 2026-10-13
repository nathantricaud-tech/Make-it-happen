# Make it happen — Vercel

Application d'étude gratuite : Next.js, connexion e-mail/mot de passe, Turso (SQLite/libSQL) et stockage Vercel Blob **privé**. Aucune connexion ChatGPT, aucun paiement Stripe, aucun quota quotidien d'IA dans l'application.

## Déploiement sur ton compte Vercel

1. Importe `nathantricaud-tech/Make-it-happen` dans Vercel (ou conserve le projet déjà lié à ce dépôt).
2. Dans **Settings → Build and Deployment**, choisis **Next.js**, racine `./`. Supprime les anciennes commandes Cloudflare et les éventuelles surcharges du dossier de sortie. Build : `pnpm build` ; installation : `pnpm install --frozen-lockfile` ; sortie : valeur par défaut de Next.js. Node.js 22.x.
3. Crée une base **Turso compatible libSQL**, puis copie son URL et son jeton dans les variables Vercel ci-dessous. Le schéma initial est créé automatiquement au premier accès, sans données de démonstration. L'ancien Site et ses données ne sont pas transférés automatiquement.
4. Dans **Storage**, crée un **Blob store privé** et connecte-le au projet. Vercel ajoute `BLOB_READ_WRITE_TOKEN`. Ne choisis pas un store public.
5. Ajoute les variables serveur ci-dessous en Production, puis redéploie. Pour les previews, utilise de préférence une base et un store séparés.

| Variable | Utilité |
| --- | --- |
| `TURSO_DATABASE_URL` | URL libSQL de ta base |
| `TURSO_AUTH_TOKEN` | Jeton d'accès à cette base |
| `BLOB_READ_WRITE_TOKEN` | Ajouté par la connexion du store Blob privé |
| `GROQ_API_KEY` | Clé de ton fournisseur IA Groq |
| `GROQ_MODEL` | Facultatif : modèle texte |
| `GROQ_VISION_MODEL` | Facultatif : modèle acceptant les images |
| `RESEND_API_KEY` | Envoi des messages de récupération de mot de passe |
| `MAIL_FROM` | `Make it happen <bonjour@ton-domaine.fr>`, domaine vérifié chez Resend |
| `APP_ORIGIN` | URL finale HTTPS du site, sans slash final |

Aucun secret dans GitHub, dans une variable `NEXT_PUBLIC_*` ou dans une conversation. Les clés de l'ancien hébergement ne sont pas copiées. La compilation fonctionne sans secrets ; les fonctions nécessitant un fournisseur restent indisponibles jusqu'à sa configuration.

## Vérification avant ouverture aux élèves

Sur le domaine final HTTPS : crée un compte avec un mot de passe d'au moins 12 caractères, déconnecte-toi puis reconnecte-toi. Demande un e-mail « mot de passe oublié », ouvre le lien reçu, change le mot de passe et vérifie que l'ancien ne fonctionne plus. Les liens expirent après 20 minutes ; les sessions précédentes sont révoquées. Sans configuration Resend complète, aucun e-mail réel ne peut partir.

Importe un PDF de plus de 4,5 Mo, affiche-le, supprime-le ; vérifie aussi une image, une fiche IA et un enregistrement vocal. Les pièces jointes vont directement du navigateur au store privé, sans traverser le corps d'une Function Vercel. Les téléchargements utilisent des liens signés valables cinq minutes après contrôle du compte propriétaire. Les réservations d'import interrompues sont nettoyées lors d'un prochain import du même compte (après expiration et délai de sécurité).

## Gratuité et limites techniques

Le site est gratuit pour les élèves, sans abonnement ni code propriétaire. Limites techniques : 50 Mio par fichier, 150 pages PDF, 500 000 caractères de cours et 1 Gio de pièces jointes par compte. Les traitements vocaux et visuels ont leurs propres limites. Les quotas et coûts des fournisseurs Vercel, Turso, Groq et Resend restent à la charge du propriétaire ; gratuit pour les élèves ne signifie pas infrastructure illimitée gratuite.

## Tu gardes la main

Le dépôt et le projet Vercel restent dans tes comptes. Chaque mise à jour de `main` est redéployée par l'intégration Git de Vercel. Les branches permettent de tester les changements avant fusion. GitHub Actions vérifie le code ; il n'utilise pas de secrets de production. Sauvegarde la base avant toute future migration destructive ; un retour arrière de code ne restaure pas les données.

## Développement

Node.js 22.13+ et pnpm 11.25.0. Place les variables serveur dans `.env.local` (ignoré par Git).

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm typecheck
pnpm build
```

Le build prépare les fichiers OCR/PDF depuis les dépendances verrouillées et les données linguistiques officielles, avec contrôle SHA-256. Il nécessite un accès réseau aux données OCR lors du premier build. La base est initialisée paresseusement : ne configure jamais de base de production pour les tests locaux.
