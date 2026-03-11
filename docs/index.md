# Documentation technique Synergy npm

Cette section décrit le fonctionnement interne de `@efrogg/synergy`.

## Structure

- `README.md`: vue d'ensemble de la lib et quickstart
- `docs/index.md`: index technique (ce document)
- `docs/session.md`: documentation détaillée de la session Mercure

## Ce qui est documenté maintenant

- Vue d'ensemble de la lib (README)
- Session Mercure:
  - `MercureSessionClient`
  - `MercureSessionRegistry`

Voir: [session.md](session.md)

## Carte rapide des composants

- `Data/EntityManager.ts`: façade principale pour charger/rechercher/sauver/supprimer
- `Data/DataLoader.ts`: injection des payloads et abonnement SSE Mercure
- `Data/Repository*.ts`: cache local d'entités + événements de changement
- `Data/Criteria/*`: filtres, tri, pagination et conversion JSON
- `Data/MercureSessionClient.ts`: API HTTP session Mercure + switch de flux
- `Data/MercureSessionRegistry.ts`: agrégation multi-sources et synchro session

## Convention actuelle (session)

- Une session cible une entité principale (ex: `Content`)
- Plusieurs sources peuvent alimenter la session (ex: `content-list`, `content-detail`)
- La session backend est maintenue tant qu'au moins une source a des IDs
- Quand toutes les sources sont vides, la session est fermée

## Contrat d'intégration recommandé

- Centraliser un registry par domaine métier (ex: session produit `Content`) dans un service partagé (`ConfigContainer`).
- Alimenter ce registry depuis la navigation (liste, détail, widgets, etc.).
- Utiliser des `sourceKey` stables et explicites (`content-list`, `content-detail`).

## Extension prévue

Cette doc sera étendue ensuite pour couvrir:
- `EntityManager` (CRUD/recherche) en détail
- `DataLoader` (pipeline d'injection et événements)
- `Criteria` avancés et filtres custom
- bonnes pratiques d'intégration Vue/Pinia/router
