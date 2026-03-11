# Cas d'usage (recettes)

Domaine commun a tous les exemples: `Block`, `Post`, `Tag`, `Author`.

## 1) Liste courte (tout en memoire)

### Objectif

Rendre une UI rapide sur petit volume (ex: tags, auteurs, statuts).

### Strategie

- Charger une fois.
- Filtrer/ordonner localement avec `Repository.search(...)`.
- Rester sans session Mercure dediee.

### Exemple

```ts
import EntityManager from "@efrogg/synergy/Data/EntityManager";
import RepositoryManager from "@efrogg/synergy/Data/RepositoryManager";
import Criteria from "@efrogg/synergy/Data/Criteria/Criteria";
import { Author, Tag } from "./domain";

const manager = new EntityManager(new RepositoryManager([Author, Tag]));
await manager.search(Author, new Criteria().withLimit(200));

const visibleAuthors = manager.getRepository(Author)
  .search({
    name: (value: string) => value.toLowerCase().includes("mar"),
  })
  .getItems();
```

### A surveiller

- Les filtres fonction (`CustomFilter`) sont locaux uniquement.
- Si le volume grandit fortement, passer au cas 2.

---

## 2) Liste longue (session Mercure ciblee)

### Objectif

Limiter le bruit temps reel a ce qui est visible dans la page.

### Strategie

- Un manager dedie pour le domaine actif (`Post`, `Block`, `Tag`, `Author`).
- `MercureSessionRegistry` cible sur `Post`.
- Deux sources minimales:
  - `post-viewport`
  - `post-detail`

### Exemple

```ts
import EntityManager from "@efrogg/synergy/Data/EntityManager";
import RepositoryManager from "@efrogg/synergy/Data/RepositoryManager";
import MercureSessionClient from "@efrogg/synergy/Data/MercureSessionClient";
import MercureSessionRegistry from "@efrogg/synergy/Data/MercureSessionRegistry";
import { Post, Block, Tag, Author } from "./domain";

const manager = new EntityManager(new RepositoryManager([Post, Block, Tag, Author]));
manager.dataLoader.setAutoResetRepositoriesOnLoad(false);

const postSession = new MercureSessionRegistry(
  manager.dataLoader,
  new MercureSessionClient(),
  "Post"
);

await postSession.setSource("post-viewport", [1001, 1002, 1003]);
await postSession.setSource("post-detail", [1002]);
await postSession.clearSource("post-detail");
await postSession.clearSource("post-viewport");
```

### A surveiller

- Garder des `sourceKey` stables.
- Bien vider les sources en sortie d'ecran.

---

## 3) Cas complexe (plusieurs `EntityManager` independants)

### Objectif

Isoler des contextes UI qui n'ont pas les memes besoins de cache/synchro.

### Exemple de separation

- `catalogManager`: donnees reference (`Author`, `Tag`).
- `editorManager`: edition/live (`Post`, `Block`).

### Strategie

- Un `RepositoryManager` par contexte.
- Pas de partage d'instances d'entites entre managers.
- Echange inter-contextes par IDs.

### Exemple

```ts
import EntityManager from "@efrogg/synergy/Data/EntityManager";
import RepositoryManager from "@efrogg/synergy/Data/RepositoryManager";
import MercureSessionClient from "@efrogg/synergy/Data/MercureSessionClient";
import MercureSessionRegistry from "@efrogg/synergy/Data/MercureSessionRegistry";
import Criteria from "@efrogg/synergy/Data/Criteria/Criteria";
import { EqualsFilter } from "@efrogg/synergy/Data/Criteria/Filter/Filter";

const catalogManager = new EntityManager(new RepositoryManager([Author, Tag]));
const editorManager = new EntityManager(new RepositoryManager([Post, Block, Author, Tag]));

editorManager.dataLoader.setAutoResetRepositoriesOnLoad(false);

const editorSession = new MercureSessionRegistry(
  editorManager.dataLoader,
  new MercureSessionClient(),
  "Post"
);

await catalogManager.search(Author, new Criteria().withLimit(500));
await editorManager.search(Post, new Criteria().withLimit(100));

const selectedAuthorId = catalogManager.getRepository(Author).first()?.getId();
if (selectedAuthorId) {
  await editorManager.search(
    Post,
    new Criteria().withFilter(new EqualsFilter("authorId", selectedAuthorId))
  );
}
```

### A surveiller

- Duplication volontaire de certaines entites entre contextes.
- Besoin de conventions claires pour faire circuler les IDs.

## 4) Regle pratique de choix

- Petit volume et peu de live: **cas 1**.
- Gros volume ou live cible: **cas 2**.
- Plusieurs domaines UI independants: **cas 3**.
