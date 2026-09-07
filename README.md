# @efrogg/synergy

`@efrogg/synergy` est une librairie front TypeScript/Vue pour manipuler un graphe d'entites metier synchronise avec un backend Synergy.

Exemples utilises dans cette doc: `Block`, `Post`, `Tag`, `Author`.

Synergy, dans les grandes lignes, est une approche full-stack de synchronisation d'entites: un backend expose des endpoints CRUD/recherche et publie des mises a jour Mercure, tandis que cette lib npm maintient un cache front coherent (repositories) et applique ces mises a jour en temps reel.

## Ce que la lib fait pour vous

- Charger des entites depuis une API HTTP.
- Les stocker localement dans des repositories reactifs.
- Mettre a jour/supprimer des entites via API.
- Recevoir des updates temps reel via Mercure.
- Cibler les updates avec des sessions (utile sur listes longues).

## Installation

```bash
npm install @efrogg/synergy
```

## Quickstart (5 minutes)

### 1) Declarer vos classes d'entites

```ts
import Entity from "@efrogg/synergy/Data/Entity";

export class Author extends Entity {
  name: string = "";
}

export class Post extends Entity {
  title: string = "";
  authorId: string | null = null;
}
```

### 2) Creer un `EntityManager`

```ts
import EntityManager from "@efrogg/synergy/Data/EntityManager";
import RepositoryManager from "@efrogg/synergy/Data/RepositoryManager";
import Criteria from "@efrogg/synergy/Data/Criteria/Criteria";
import { Author, Post } from "./domain";

const manager = new EntityManager(
  new RepositoryManager([Author, Post]),
  "/synergy/entity"
);
```

### 3) Charger les donnees

```ts
await manager.search(Post, new Criteria().withLimit(50));
```

### 4) Lire depuis les repositories

```ts
const posts = manager.getRepository(Post).getItems();
console.log(posts);
```

### 5) Modifier et sauvegarder

```ts
const first = manager.getRepository(Post).first();
if (first) {
  first.title = "Nouveau titre";
  await manager.save(first, ["title"]);
}
```

## Ou aller ensuite

- Parcours de doc: [docs/index.md](docs/index.md)
- API et outils: [docs/api-tools.md](docs/api-tools.md)
- Sessions Mercure: [docs/session.md](docs/session.md)
- Recettes (cas d'usage): [docs/use-cases.md](docs/use-cases.md)
