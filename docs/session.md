# Session Mercure: SessionClient et SessionRegistry

Ce document décrit les deux composants de session Mercure de la lib npm:
- `MercureSessionClient`
- `MercureSessionRegistry`

Objectif: maintenir un topic Mercure ciblé sur les entités visibles selon la navigation front.

## 0) Pourquoi ce mécanisme existe

Sans session ciblée, `Content` et `ContentBlock` peuvent être poussés sur un flux projet global.
Pendant une synchro massive, le front reçoit alors de très gros volumes non affichés.

Cible:
- la session front ne contient que les IDs `Content` visibles,
- les mises à jour `Content` et `ContentBlock` sont routées vers le topic de session,
- la navigation alimente la session (liste + détail), pas la configuration statique.

## 1) MercureSessionClient

Fichier: `Data/MercureSessionClient.ts`

### Rôle

`MercureSessionClient` encapsule les appels HTTP de session Mercure et la bascule d'abonnement SSE côté `DataLoader`.

### API publique

```ts
sync(selectors, currentSessionId?) => Promise<MercureSessionResponse>
close(sessionId) => Promise<void>
switchSubscription(dataLoader, mercureUrl) => void
switchSubscriptionWithPrevious(dataLoader, mercureUrl, previousMercureUrl) => void
```

### Types

```ts
export type MercureSessionSelector = {
  entity: string,
  ids: Array<number | string>
};

export type MercureSessionResponse = {
  sessionId: string,
  mercureUrl: string,
  topic?: string,
  expiresAt?: number
};
```

### Comportement

- `sync`:
  - `POST /synergy/entity/mercure-session` si `currentSessionId` est `null`
  - `PUT /synergy/entity/mercure-session/{id}` sinon
  - lève une erreur si HTTP non-2xx
- `close`:
  - `DELETE /synergy/entity/mercure-session/{id}`
  - ignore le `404` (session déjà expirée/supprimée)
- `switchSubscriptionWithPrevious`:
  - désabonne seulement l'ancienne URL de session,
  - abonne la nouvelle URL.

## 2) MercureSessionRegistry

Fichier: `Data/MercureSessionRegistry.ts`

### Rôle

`MercureSessionRegistry` gère un modèle multi-sources et synchronise une session backend unique:
- fusionne les IDs de plusieurs sources de navigation,
- sérialise les opérations asynchrones,
- ouvre/maintient/ferme la session selon l'état fusionné.

### API publique

```ts
setSource(sourceKey, ids) => Promise<void>
clearSource(sourceKey) => Promise<void>
close() => Promise<void>
```

### Modèle interne

- `sourceRegistry: Map<string, Array<string|number>>`
- `sessionId: string | null`
- `sessionMercureUrl: string | null`
- `queue: Promise<void>` pour séquencer les sync

### Cycle de vie

1. `setSource` remplace le snapshot d'une source.
2. La fusion de toutes les sources est calculée.
3. Si fusion non vide:
   - `sessionClient.sync(...)`
   - mise à jour de `sessionId`/`sessionMercureUrl`
   - switch d'abonnement vers la nouvelle URL session.
4. Si fusion vide:
   - fermeture backend (`close(sessionId)` si présent)
   - désabonnement de l'URL session locale.

## 3) Exemple d'intégration centralisée (ConfigContainer)

```ts
import MercureSessionClient from "@efrogg/synergy/Data/MercureSessionClient";
import MercureSessionRegistry from "@efrogg/synergy/Data/MercureSessionRegistry";

const productSessionRegistry = new MercureSessionRegistry(
  configEntityManager.dataLoader,
  new MercureSessionClient(),
  'Content'
);

await productSessionRegistry.setSource('content-list', [1, 2, 3]);
await productSessionRegistry.setSource('content-detail', [42]);
```

## 4) Exemple d'alimentation par navigation

### ContentPage (liste)

```ts
const visibleIds = contents
  .map((content) => content.id)
  .filter((id): id is string => id !== null);

await configContainer.setProductSessionSource('content-list', visibleIds);

onUnmounted(() => {
  void configContainer.clearProductSessionSource('content-list');
});
```

### ContentDetailPage (détail ouvert)

```ts
watch(contentId, (newId) => {
  if (newId === null) {
    void configContainer.clearProductSessionSource('content-detail');
  } else {
    void configContainer.setProductSessionSource('content-detail', [newId]);
  }
});

onUnmounted(() => {
  void configContainer.clearProductSessionSource('content-detail');
});
```

## 5) Synchronisation ContentBlock liée aux Content

Le registry npm reste volontairement centré sur l'entité principale (`Content`).
L'ajout des entités relationnelles (ex: `ContentBlock`) se fait côté application/backend au routage.

Exemple d'approche:
- lors du routage d'un `ContentBlock`, retrouver les `Content` liés (`source`, `target`),
- lire les sessions actives qui contiennent ces `Content`,
- ajouter les topics de ces sessions à l'événement de dispatch.

Cela permet de garder une API npm simple (session = IDs d'une entité cible), tout en couvrant les besoins relationnels.

## 6) Points d'attention

- Le registry ne connaît pas la logique métier des sources: il fusionne uniquement des IDs.
- Les clés de source doivent être stables (`content-list`, `content-detail`, etc.).
- La session est volontairement "snapshot-based" par source (pas de delta add/remove).
- En cas d'erreur HTTP, laisser la couche appelante décider du fallback UI.
