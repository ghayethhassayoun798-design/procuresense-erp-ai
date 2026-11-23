# ProcureSense ERP AI

Application locale de gestion commerciale avec interface en français et devise en dinar tunisien (DT). Les prix sont saisis au millime (3 décimales). Elle fonctionne avec PostgreSQL 18 portable, livré dans le dossier du projet, sans service Windows ni Docker. Le serveur écoute uniquement sur 127.0.0.1; les exemples de données sont fictifs.

## Prérequis et démarrage

Windows 11 et Node.js 24 (npm inclus). Dans PowerShell, depuis la racine du dépôt :

    .\setup.ps1
    .\start.ps1

Ouvrir http://localhost:3000. Le premier démarrage reprend automatiquement les données de `data/procuresense.db` quand elles existent, notamment le compte administrateur et les enregistrements métier. Si aucune base SQLite historique n’existe, créez l’administrateur depuis l’application avec un mot de passe d’au moins 12 caractères. `start.ps1` démarre aussi PostgreSQL si nécessaire. Arrêter le serveur avec Ctrl+C, puis arrêter PostgreSQL proprement avec `.\stop.ps1`.

`setup.ps1` prépare les mots de passe locaux, initialise PostgreSQL dans `data/postgres`, configure la base `procuresense`, installe les dépendances, applique les migrations et importe les données SQLite existantes une seule fois. `start.ps1` applique les nouvelles migrations avant chaque démarrage. Les secrets générés restent dans `.env` et `data/*.secret`; ces fichiers sont ignorés par Git.

## Modules

- BI connecté à la base: ventes, achats, marge estimée, créances, factures en retard, valorisation du stock, produits sous le minimum, meilleurs produits et clients, commandes récentes.
- Filtre de dates sur le tableau de bord et les rapports; graphiques mensuels; recherche, tri et pagination.
- Produits, catégories, fournisseurs, clients, achats, demandes d’achat, ventes, stock et mouvements, factures et paiements.
- Opérations de stock et commandes transactionnelles; stock négatif bloqué; vente confirmée crée une facture; réception achat augmente le stock.
- Comparaison fournisseurs pondérée et recommandations de réapprovisionnement déterministes avec explications.
- Assistant IA en lecture seule, accessible depuis « Assistant IA »; il répond sur les stocks, les alertes, les ventes et les meilleurs produits.
- Comptes et rôles contrôlés côté serveur; session HttpOnly, mots de passe scrypt, limitation des tentatives de connexion et journal d’audit.
- Validation des écritures côté serveur avec Zod.

## PostgreSQL et données

PostgreSQL 18 est embarqué localement dans `runtime/postgresql`; le cluster réside dans `data/postgres`. Aucune installation système ou permission administrateur Windows n’est nécessaire. Le serveur de base écoute seulement sur `127.0.0.1:5432`.

    npm run db:validate
    npm run db:generate
    npm run db:migrate
    npm run db:seed
    npm run db:import-sqlite

La migration versionnée est dans `prisma/migrations`. `db:import-sqlite` sert à reprendre la base antérieure et ne doit être relancé que si la base PostgreSQL cible est vide.

## Assistant IA local

Pour le modèle local gratuit, lancez une seule fois `.\setup-ai.ps1`. Il installe Ollama dans `runtime/ollama`, télécharge Qwen3.5 2B (environ 3,1 Go) dans `data/ollama`, puis configure `.env`. Ensuite `.\start.ps1` démarre le modèle local et l’ERP. Aucun compte, clé API ou paiement n’est nécessaire; les questions et les données ERP restent sur ce PC. La vitesse dépend du processeur et de la mémoire disponibles.

L’assistant est en lecture seule et n’approuve ni commande ni paiement. Les recommandations et scores restent déterministes; le modèle ne les remplace pas. Les paramètres d’API externe restent disponibles si un fournisseur payant est configuré manuellement.

## n8n facultatif

Cinq modèles inactifs sont dans `n8n/`: alerte stock, demandes en attente, factures en retard, comparaison fournisseurs et résumé BI quotidien. Ils ne sont pas importés ni testés dans une instance n8n. Les workflows nécessitent une instance n8n, un SMTP et des destinataires. `AUTOMATION_TOKEN` autorise uniquement les requêtes GET. Les workflows n’approuvent aucun achat et ne traitent aucun paiement.

## Sauvegarde et restauration

    .\backup-database.ps1
    .\restore-database.ps1

Les sauvegardes sont des dumps PostgreSQL compressés dans `backups/`. La restauration demande confirmation et crée une sauvegarde de sécurité avant remplacement. `reset-demo.ps1` conserve le compte administrateur et vide les données commerciales après sauvegarde.

## Vérification

    npm run lint
    npx tsc --noEmit
    npm test
    npm run build

## Limites

MVP local, sans certification de facturation fiscale tunisienne ni e-invoicing. Les prix et paiements sont saisis en DT avec une précision au millime. Les montants historiques gardent leur valeur nominale (par exemple 12,34 devient 12,340 DT); aucun taux de change n’est appliqué. La marge utilise un coût estimé égal à 62 % des ventes; la valeur du stock utilise le prix de vente. Le taux de taxe est indicatif et n’est pas appliqué aux lignes de facture. Les recommandations sont déterministes. Un résumé explicatif facultatif peut transmettre les éléments sélectionnés à un fournisseur externe uniquement après clic; il ne change aucun chiffre et revient aux règles locales en cas d’échec. Pour un déploiement multi-utilisateur, il reste nécessaire de revoir la sécurité, les sauvegardes et les tests de charge.
