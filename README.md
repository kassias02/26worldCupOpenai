# Cup26Predictor — Simulation Coupe du Monde 2026

Prototype SEO-first pour simuler la phase à élimination directe (à partir des 1/16 de finale), générer une image partageable, et collecter des emails.

## Fonctionnalités

- Simulation du tableau à élimination directe : 1/16, 1/8, 1/4, 1/2, finale.
- Génération d'une carte image partageable avec :
  - gagnant,
  - parcours,
  - branding `cup26predictor.com`.
- Boutons de partage social : X, WhatsApp, Instagram (copie de message + téléchargement image).
- SEO technique :
  - balises meta complètes,
  - Open Graph / Twitter Cards,
  - données structurées JSON-LD,
  - `robots.txt`, `sitemap.xml`, `manifest.webmanifest`.
- Collecte email (front-end + endpoint PHP optionnel).

## Démarrage

1. Lancer un serveur local:

```bash
python3 -m http.server 8080
```

2. Ouvrir ensuite:

- `http://localhost:8080`

> Note: le formulaire email vers `/api/subscribe.php` nécessite un serveur PHP pour fonctionner côté backend.

## Endpoint email (optionnel)

Le formulaire tente d'envoyer les emails vers `POST /api/subscribe.php`.
Un exemple de script est fourni dans `api/subscribe.php` (à déployer côté serveur).

## Notes FIFA 2026

Le format intègre 48 équipes avec une phase finale qui commence en 1/16 (Round of 32).

