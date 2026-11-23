# Workflows n8n (facultatifs)

Les cinq fichiers JSON sont des modèles à importer dans une instance n8n installée sur la même machine que l’ERP. Ils ne sont ni importés ni testés dans cette installation. L’ERP fonctionne sans n8n.

## Configuration

1. Dans `.env`, définissez `AUTOMATION_TOKEN` avec une longue valeur aléatoire. PowerShell peut générer un secret avec `[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))`.
2. Redémarrez l’ERP. Le jeton autorise uniquement les requêtes HTTP `GET` des workflows et donne accès BI en lecture seule.
3. Importez un JSON depuis **Workflows → Import from File**.
4. Dans le nœud **ERP API**, remplacez `CHANGE_ME` par le jeton; adaptez l’URL si le port ou l’hôte change.
5. Configurez une credential SMTP et le destinataire dans le nœud **Send notification**. Réglez le fuseau horaire n8n.
6. Exécutez manuellement et vérifiez le résultat et le courriel avant d’activer l’horaire.

Ces modèles envoient un courriel si SMTP est configuré. Ils ne valident aucune demande, ne passent aucune commande et n’exécutent aucun paiement. Ils ne sont pas testés dans votre instance n8n.

## Modèles

- `low-stock.json`: recommandations de réapprovisionnement positives.
- `purchase-requests.json`: demandes en attente.
- `overdue-invoices.json`: factures en retard.
- `supplier-comparison.json`: meilleure offre classée par produit.
- `daily-bi-summary.json`: indicateurs du tableau de bord.

Les modèles utilisent des routes protégées par `AUTOMATION_TOKEN`; le jeton n’est accepté que pour des requêtes en lecture (`GET`).

## Installation locale sous Windows

Depuis la racine du projet, lancez `./setup-n8n.ps1`. Le script installe n8n dans `work/n8n-runtime`, lit `AUTOMATION_TOKEN` depuis `.env`, importe les cinq modèles avec l'URL ERP `http://127.0.0.1:3001`, puis démarre n8n sur `http://127.0.0.1:5678`. Au premier accès, créez le compte propriétaire n8n.

Les workflows restent désactivés après import. Pour les utiliser, configurez d'abord une credential SMTP et un destinataire dans chaque nœud `Send notification`, exécutez un essai manuel, puis activez l'horaire. L'installation de n8n n'est pas incluse dans `start.ps1`; le site ERP continue de fonctionner indépendamment.
