# D鰬oiement Render  ProcureSense

Le fichier render.yaml configure le service web Next.js et sa base PostgreSQL. Render applique les migrations avant de d魡rrer le serveur. Le premier visiteur cr饠l'administrateur depuis l'飲an de configuration; les donn饳 de la base locale ne sont pas incluses.

## Offre gratuite

Cette configuration choisit les ressources gratuites pour une d魯nstration. Le service web peut s'endormir apr賠une p鲩ode sans trafic et red魡rrer ࠬa prochaine visite. La base PostgreSQL gratuite Render expire apr賠30 jours; exportez les donn饳 et migrez vers une base durable avant cette date si vous devez conserver le compte et les donn饳.

## Fonctions qui restent s鰡r饳

Les workflows n8n sont des mod謥s dans le d鰴t, ils ne deviennent pas actifs avec le site. Il faut h颥rger/configurer n8n s鰡r魥nt, changer les URLs locales vers l'URL Render, puis ajouter le SMTP et les destinataires. L'assistant utilise un fournisseur externe uniquement si ses param贲es d'API sont configur鳻 le mod謥 Ollama local ne se d鰬ace pas sur Render.

Ne mettez jamais un fichier .env, un mot de passe, une cl頁PI ou une copie de la base locale dans le d鰴t public.
