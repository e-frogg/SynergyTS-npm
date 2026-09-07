# API et outils de base

## 1) Modele mental

Pensez la lib en 3 couches:

1. **Facade applicative**: `EntityManager`
- Votre point d'entree pour charger, rechercher, sauvegarder, supprimer.

2. **Cache local reactive**: `RepositoryManager` + `Repository` + `Entity`
- Les donnees vivent ici cote front.
- Votre UI lit principalement depuis ces repositories.

3. **Transport et temps reel**: `DataLoader` + Mercure
- Injection des payloads backend.
- Abonnement SSE et application des actions (`inject`, `remove`).

## 2) Premier cycle complet (a retenir)

1. Creer `EntityManager` avec vos classes d'entites.
2. Appeler `load(...)` ou `search(...)`.
3. Lire les donnees dans les repositories.
4. Modifier une entite locale.
5. Appeler `save(...)`.
6. Laisser Mercure maintenir la coherence si active.

## 3) Les classes essentielles

### `EntityManager`

**Quand l'utiliser**:
- Toujours. C'est la facade principale.

**Methodes clefs**:

```ts
constructor(repositoryManager: RepositoryManager, apiBaseUrl: string = '/synergy/entity')

load(url: string, data?: object | null, method?: string, forceFullUpdate?: boolean | null): Promise<dataLoadResult>
search<T extends Entity>(theClass: new (...args: any[]) => T, criteria?: Criteria, isFullUpdate?: boolean): Promise<dataLoadResult>

save(entity: Entity, fields?: string[]): Promise<Entity>
delete(entity: Entity): Promise<Entity>

getRepository<T extends Entity>(theClass: new (...args: any[]) => T): Repository<T>
clear(): void
```

### `RepositoryManager` et `Repository<T>`

**Quand les utiliser**:
- Lire les donnees pour l'UI.
- Filtrer/ordonner localement.

**Methodes clefs (`Repository`)**:

```ts
getItems(): T[]
get(id: string | null): T | null
first(): T | null
getIds(): string[]

search(criteria: Criteria | {[key: string]: any}): Repository<T>
filter(callback: (entity: T) => boolean): Repository<T>

addFromJson(json: {[key: string]: any}, allowUpdate?: boolean, dispatchUpdate?: boolean): {entity: T, action: 'add' | 'update'}
remove(id: string, dispatchUpdate?: boolean): void
clear(dispatchUpdate?: boolean): void
```

### `Entity`

**Quand l'etendre**:
- Pour chaque type metier (`Post`, `Tag`, etc.).

**Points utiles**:
- `toJson()` pour l'envoi backend.
- `static _properties = { publishedAt: 'date' }` pour typer des dates.
- `getRelation(...)` et `getOneToMany(...)` pour aides de relation.

### `DataLoader`

**Quand le toucher directement**:
- Rarement.
- Principalement pour la config de reset ou les abonnements Mercure.

```ts
setAutoResetRepositoriesOnLoad(autoReset: boolean): void
subscribeToMercure(mercureUrl: string): void
unsubscribeToMercure(mercureUrl?: string | null): void
```

## 4) Recherche avec `Criteria`

`Criteria` sert a construire un payload backend propre.

```ts
import Criteria from "@efrogg/synergy/Data/Criteria/Criteria";
import FieldSort from "@efrogg/synergy/Data/Criteria/Sort/FieldSort";
import { ContainsFilter } from "@efrogg/synergy/Data/Criteria/Filter/Filter";

const criteria = new Criteria()
  .withLimit(20)
  .withOffset(0)
  .withTotalCount(true)
  .withAssociation("author")
  .withAssociation("tags");

criteria.withFilter(new ContainsFilter("title", "release"));
criteria.withSort(new FieldSort("publishedAt", "desc"));
```

Conversion JSON:

```ts
import CriteriaConverter from "@efrogg/synergy/Data/Criteria/CriteriaConverter";

const payload = CriteriaConverter.toJson(criteria);
```

## 5) Evenements a connaitre

| Evenement | Type | Quand |
|---|---|---|
| `DataLoadedEvent` | `dataLoaded` | Apres injection d'un payload/flux |
| `ListChangedEvent` | `ListChanged` | La liste du repository a change |
| `ItemListChangedEvent` | `ItemListChangedEvent` | Un lot d'IDs a ete mis a jour |
| `EntityChangedEvent` | `entityChanged` | `entity.update(...)` est appele |

Exemple:

```ts
import ListChangedEvent from "@efrogg/synergy/Data/Event/ListChangedEvent";

const postRepo = manager.getRepository(Post);
postRepo.addEventListener(ListChangedEvent.TYPE, () => {
  console.log("posts changes", postRepo.getIds());
});
```

## 6) Outils de base utiles

### `DiffManager`

Utilise par `EntityManager.save(...)` pour n'envoyer que les champs modifies.

### `ValueExtractor`

Utilise en interne pour lire des chemins (`author.name`) dans recherche/tri locaux.

## 7) Limites et pieges connus

- `CustomFilter` ne peut pas etre serialise en JSON (`toJson()` leve une erreur).
  Il est reserve au filtrage local.
- `CriteriaConverter.toJson(...)` n'envoie `offset` que si `offset > 0`.
- Les IDs sont normalises en string dans les entites (`setId(...)`).
- `DataLoader` suppose un environnement navigateur (`EventSource`, `document`).
- `EntityManager.delete(...)` ne valide pas explicitement le status HTTP avant `resolve`.
