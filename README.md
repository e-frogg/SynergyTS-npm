# @efrogg/synergy

Lib TypeScript/Vue pour manipuler des entités Synergy côté front:
- chargement/édition d'entités (`EntityManager`, `RepositoryManager`),
- recherche via critères (`Criteria`),
- synchro temps réel via Mercure (`DataLoader`),
- session Mercure multi-sources pour flux ciblés (`MercureSessionClient`, `MercureSessionRegistry`).

## Installation

```bash
npm install @efrogg/synergy
```

## Vue d'ensemble

Le coeur de la lib est dans `Data/`:
- `EntityManager`: API CRUD/recherche + orchestration des repositories,
- `DataLoader`: injection des payloads API et gestion des abonnements Mercure,
- `Repository*`: stockage local par type d'entité,
- `Criteria/*`: construction des requêtes de recherche,
- `MercureSessionClient` et `MercureSessionRegistry`: gestion des topics Mercure de session.

Architecture rapide:
- `DataLoader` reste le point d'entrée de la synchro SSE,
- `MercureSessionClient` gère le contrat HTTP des sessions backend,
- `MercureSessionRegistry` agrège les IDs visibles (plusieurs sources front) et maintient une session unique.

## Démarrage rapide

```ts
import EntityManager from "@efrogg/synergy/Data/EntityManager";
import RepositoryManager from "@efrogg/synergy/Data/RepositoryManager";
import Project from "@/Data/Entity/Project";

const entityManager = new EntityManager(new RepositoryManager([Project]));

const projects = await entityManager.load('/synergy/data/initial-data');
console.log(projects.result);
```

## Session Mercure (focus actuel)

La doc technique détaillée de la session est ici:
- [docs/session.md](docs/session.md)

Exemple minimal:

```ts
import MercureSessionClient from "@efrogg/synergy/Data/MercureSessionClient";
import MercureSessionRegistry from "@efrogg/synergy/Data/MercureSessionRegistry";

const sessionClient = new MercureSessionClient();
const sessionRegistry = new MercureSessionRegistry(
  entityManager.dataLoader,
  sessionClient,
  'Content'
);

await sessionRegistry.setSource('content-list', [1, 2, 3]);
await sessionRegistry.setSource('content-detail', [42]);
```

## Documentation

- Index technique: [docs/index.md](docs/index.md)
- Session Mercure: [docs/session.md](docs/session.md)

## Statut

Cette documentation est une base initiale.
La couverture complète des autres composants de la lib sera ajoutée progressivement.
