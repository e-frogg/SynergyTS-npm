# Documentation `@efrogg/synergy`

Cette documentation est organisee pour une lecture progressive.

Domaine d'exemple unique: `Block`, `Post`, `Tag`, `Author`.

Synergy, en resume, combine un backend qui gere les entites (CRUD/recherche + diffusion Mercure) et un frontend qui maintient un modele local reactive synchronise en continu.

## Commencer ici

1. Lire le [README](../README.md) pour un premier chargement de donnees.
2. Lire [api-tools.md](api-tools.md) section "Modele mental" puis "Premier cycle complet".
3. Lire [session.md](session.md) si vous avez des listes longues/temps reel cible.
4. Lire [use-cases.md](use-cases.md) pour des recettes concretes.

## Selon votre besoin

- "Je veux juste charger, afficher, sauvegarder":
  - [README](../README.md)
  - [api-tools.md](api-tools.md)

- "Je dois faire du live sur gros volume":
  - [session.md](session.md)
  - [use-cases.md](use-cases.md#2-liste-longue-session-mercure-ciblee)

- "Je dois isoler plusieurs contextes applicatifs":
  - [use-cases.md](use-cases.md#3-cas-complexe-plusieurs-entitymanager-independants)

## Carte rapide des briques

- `EntityManager`: facade principale.
- `DataLoader`: ingestion des payloads + SSE Mercure.
- `RepositoryManager`/`Repository`: cache local reactive.
- `Criteria`/`CriteriaConverter`: recherche et conversion JSON.
- `MercureSessionClient`/`MercureSessionRegistry`: session ciblee.

## Contrat backend attendu

Par defaut, la lib parle avec:
- `/synergy/entity/*` pour CRUD/recherche.
- `/synergy/entity/mercure-session` pour sessions Mercure.

Ces URLs sont configurables dans les constructeurs.
