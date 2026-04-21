# Cup26Predictor — Simulation Coupe du Monde 2026

Cette version simule le tournoi complet avec:
- vrais groupes A-L (mise à jour avril 2026),
- saisie des scores de tous les matchs de groupes,
- classement automatique par groupe,
- sélection des 8 meilleurs troisièmes,
- génération des matchs de 1/32 puis bracket jusqu'au champion,
- image partageable + collecte email.

## Démarrage

```bash
python3 -m http.server 8080
```

Puis ouvrir `http://localhost:8080`.

## Source de données groupes

- AP News — article "World Cup 2026: Who’s in, where to watch, betting odds, schedules and more" (mise à jour avril 2026).

## Note sur les règles FIFA

Le classement est calculé avec les critères principaux FIFA (points, diff. de buts, buts marqués) et un mini-classement en confrontations directes pour départager des ex aequo.
