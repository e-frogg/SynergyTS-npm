# Sessions Mercure (guide progressif)

Objectif: recevoir uniquement les updates utiles quand la liste est grande.

## 1) Le probleme

Sur une liste longue de `Post`, un flux global peut noyer le front avec des updates hors ecran.

La solution:
- declarer les IDs visibles,
- maintenir une session Mercure ciblee,
- brancher le `DataLoader` sur ce flux de session.

## 2) Les 2 briques

### `MercureSessionClient`

- Parle HTTP avec le backend session.
- Bascule l'abonnement SSE du `DataLoader`.

Endpoints par defaut:
- `POST /synergy/entity/mercure-session` (creation)
- `PUT /synergy/entity/mercure-session/{sessionId}` (mise a jour)
- `DELETE /synergy/entity/mercure-session/{sessionId}` (fermeture)

### `MercureSessionRegistry`

- Gere vos sources UI (`post-viewport`, `post-detail`, etc.).
- Fusionne les IDs.
- Synchronise une session backend unique.
- Serialise les operations async pour eviter les courses.

## 3) Cycle de vie d'une session

1. `setSource("post-viewport", [...ids])`
2. `setSource("post-detail", [...ids])`
3. Le registry fusionne puis appelle `sync(...)`
4. Le backend renvoie `sessionId` + `mercureUrl`
5. Le client branche `DataLoader` sur cette URL
6. Quand toutes les sources sont videes, `close()` est appele

## 4) Exemple complet

```ts
import MercureSessionClient from "@efrogg/synergy/Data/MercureSessionClient";
import MercureSessionRegistry from "@efrogg/synergy/Data/MercureSessionRegistry";

const session = new MercureSessionRegistry(
  entityManager.dataLoader,
  new MercureSessionClient(),
  "Post"
);

// 1) liste visible
await session.setSource("post-viewport", [101, 102, 103]);

// 2) detail
await session.setSource("post-detail", [102]);

// 3) fermeture detail
await session.clearSource("post-detail");

// 4) sortie d'ecran
await session.clearSource("post-viewport");
```

## 5) Cas relationnel: `Block` depend de `Post`

Le registry est centre sur une entite principale (ex: `Post`).

Si un `Block` doit suivre la meme session:
- le front continue d'envoyer des IDs de `Post`,
- le backend route aussi les updates de `Block` vers les topics de session lies a ces posts.

Cela garde l'API front simple.

## 6) Bonnes pratiques

- Utiliser des `sourceKey` stables.
- Envoyer des snapshots d'IDs (pas des deltas manuels).
- Appeler `close()` lors d'un teardown global (logout/destruction module).
- Gérer les erreurs reseau (`sync`/`close`) dans la couche UI (retry/fallback).
