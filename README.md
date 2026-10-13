# Make it happen — déploiement indépendant

Le code appartient au titulaire du dépôt. GitHub conserve le code et son historique ; Cloudflare exécute le site, sa base D1 et les fichiers R2. La connexion des élèves utilise un email et un mot de passe. Aucune connexion ChatGPT n'est requise dans cet export.

## État actuel

Le lancement public reste à effectuer. Le site est entièrement gratuit pour les élèves. Aucun abonnement, paiement ou compte Stripe n’est nécessaire. Le service d'emails n'est pas encore configuré. Aucun compte Cloudflare indépendant n'est connecté.

## 1. Garder la main sur le code

Dépôt choisi par le propriétaire : `nathantricaud-tech/Make-it-happen`. Le code est importé à la racine. Garder les accès propriétaire aux comptes GitHub, Cloudflare, Stripe, fournisseur email et domaine. Le dépôt est actuellement public : son code est visible, jamais ses secrets ni les données des élèves. Tu peux le rendre privé dans GitHub si tu le souhaites.

## 2. Hébergement

Dans son propre compte Cloudflare, créer une base D1 `make-it-happen` et un bucket R2 `make-it-happen-files` privé. Activer Workers et choisir un sous-domaine workers.dev ou un domaine personnel. Les consommations IA, stockage, email et hébergement peuvent être facturées suivant les offres choisies.

Dans GitHub, créer l'environnement `production` (Settings > Environments), puis y définir :

| Type | Nom | Valeur |
| --- | --- | --- |
| Secret | CLOUDFLARE_API_TOKEN | Jeton limité à Workers Scripts Edit, D1 Edit et R2 Edit sur le compte choisi |
| Secret | CLOUDFLARE_ACCOUNT_ID | Identifiant du compte Cloudflare |
| Variable | CLOUDFLARE_D1_ID | Identifiant de la nouvelle base D1 |
| Variable | CLOUDFLARE_R2_BUCKET | Nom du bucket R2 |
| Variable | APP_ORIGIN | Origine finale HTTPS sans slash final |

Sans configuration Cloudflare, le workflow vérifie seulement le code et ne publie rien. Une fois configuré, il configure les ressources, vérifie TypeScript et l'authentification, compile, applique les migrations et déploie. Chaque mise à jour de `main` déclenche ensuite un nouveau déploiement. Faire les changements sur une branche et les fusionner après validation. Une version antérieure du code peut être redéployée ; ne pas annuler automatiquement une migration de données.

## 3. Secrets du serveur

Dans Cloudflare Worker > Settings > Variables and Secrets, définir directement :

- `GROQ_API_KEY` : clé IA de ton compte ; éventuellement `GROQ_MODEL` et `GROQ_VISION_MODEL`.
- `RESEND_API_KEY` : clé Resend limitée à l'envoi pour le domaine vérifié.
- `MAIL_FROM` : `Make it happen <bonjour@ton-domaine.fr>` après vérification DNS du domaine.
- `APP_ORIGIN` : origine finale HTTPS sans slash (également variable GitHub).

Ne jamais placer une clé dans le code, une variable NEXT_PUBLIC, une issue GitHub ou une conversation. Les secrets du Site actuel ne sont pas copiés dans l'export.

## 4. Accès gratuit

Toutes les fonctionnalités sont gratuites. Il n’y a ni paiement, ni code propriétaire, ni quota quotidien d’IA imposé par le site. Les limites techniques des fichiers, du stockage (1 Go par compte) et du fournisseur IA restent applicables. Les coûts éventuels de fonctionnement sont supportés par le propriétaire.

## 5. Emails de récupération

Vérifier le domaine expéditeur chez Resend (DNS). Le lien est aléatoire, seule son empreinte est stockée, expiration 20 minutes, utilisation unique. Il arrive sur `/reset-password` avec le jeton dans le fragment (pas dans les journaux HTTP). Les anciennes sessions et les anciens liens sont invalidés après changement. Le code de secours reste disponible.

Tester avec une adresse que tu contrôles : réception, lien expiré, seconde utilisation refusée et reconnexion avec le nouveau mot de passe. Les réponses ne révèlent pas si une adresse possède un compte. Les erreurs de livraison produisent un événement serveur générique `PASSWORD_RESET_DELIVERY_FAILED` sans adresse ni jeton. Les adresses ne sont pas vérifiées lors de l'inscription ; la réception d'un lien prouve le contrôle de la boîte pour la récupération.

## 6. Données existantes et accès propriétaire

Cet export contient **le code uniquement**, sans utilisateurs, mots de passe, cours, fichiers, abonnements ou secrets. La nouvelle base démarre vide. Pour conserver les comptes et cours existants, il faudra réaliser une migration privée de D1 et R2 en préservant les identifiants utilisateur et les droits du propriétaire ; ce transfert n'a pas encore été effectué. Ne pas supprimer l'ancien Site avant vérification de la migration. Le code d'accès illimité est lié au premier compte propriétaire qui le réclame : ne pas le partager.

## 7. Validation avant annonce

Vérifier sur téléphone et PC : inscription, récupération email, import et suppression de cours, génération IA, absence de paywall. Ajouter les informations réelles de l'éditeur, conditions de l'abonnement, confidentialité et contact d'assistance avant d'accueillir des clients. Le Site privé actuel reste disponible pendant cette préparation.

## Développement local

Node 22.13+ et pnpm (version du package.json). `pnpm install --frozen-lockfile`, `pnpm dev`, `pnpm build`. Le fichier wrangler contient initialement un identifiant D1 de substitution : `scripts/configure-deployment.mjs` exige un identifiant réel avant déploiement.

Les ressources lourdes OCR et PDF sont reconstruites au build depuis les dépendances verrouillées et les données linguistiques officielles, avec vérification SHA-256. Elles ne sont pas stockées dans GitHub.
