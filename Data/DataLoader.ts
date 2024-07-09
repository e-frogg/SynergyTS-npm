import RepositoryManager from "./RepositoryManager";
import EventDispatcher from "./EventDispatcher";
import DataLoadedEvent from "./Event/DataLoadedEvent";
import Entity from "./Entity";
import DiffManager from "./DiffManager";

export default class DataLoader extends EventDispatcher {

    private mercureDataLoaderSources: { [key: string]: EventSource } = {};

    constructor(
        private repositoryManager: RepositoryManager,
        private diffManager: DiffManager,
    ) {
        super();
    }

    unsubscribeToMercure(mercureUrl: string | null = null) {
        // if no url is provided, unsubscribe from all
        if (mercureUrl === null) {
            for (const [url, source] of Object.entries(this.mercureDataLoaderSources)) {
                source.close();
                delete this.mercureDataLoaderSources[url];
            }
        } else if (this.mercureDataLoaderSources[mercureUrl]) {
            this.mercureDataLoaderSources[mercureUrl].close();
            delete this.mercureDataLoaderSources[mercureUrl];
        }
    }

    subscribeToMercure(mercureUrl: string) {
        // avoid subscribing twice
        if (this.mercureDataLoaderSources[mercureUrl]) {
            console.warn('already subscribed to ' + mercureUrl)
            return;
        }

        console.warn('subscribing to ' + mercureUrl)
        let mercureSource = new EventSource(mercureUrl, {
            withCredentials: true
        });

        // save into the list of sources
        this.mercureDataLoaderSources[mercureUrl] = mercureSource;

        mercureSource.onmessage = event => {
            // Will be called every time an update is published by the server
            let actions = JSON.parse(event.data);
            actions.map((action: {
                action: string,
                data: Array<{ entityName: string, entities: Array<{ [key: string]: any }> }>,
                fullUpdate: boolean | null
            }) => {
                // action.data.map((actionData: { entityName: string, entities: Array<{ [key: string]: any }> }) => {
                switch (action.action) {
                    case 'remove':
                        this.remove(action.data);
                        break;
                    case 'inject':
                        this.inject(action.data, action.fullUpdate ?? false);
                        break;
                }
            });

            this.dispatchEvent(new DataLoadedEvent(actions))
        }
    }

    /**
     * @internal
     * use EntityManager.load instead
     *
     * @param url
     * @param data
     * @param method
     */
    async load(url: string, data: object | null = null, method: string = 'GET'): Promise<{
        fullData: Entity[],
        result: Entity[]
    }> {

        // voir https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
        let fetchParams: { method: string, body: string | null } = {
            method: method,
            body: null
        }
        if (data !== null) {
            fetchParams.body = JSON.stringify(data)
        }
        return new Promise((resolve, fail) => {

            fetch(url, fetchParams).then(response => {
                return response.json().then(({mercureUrl, data, mainIds}:{mercureUrl:string|null,data:any,mainIds:null|{string:Array<number|string>}}) => {
                    this.inject(data, true)
                    this.initialize();
                    if (mercureUrl) {
                        this.subscribeToMercure(mercureUrl);
                    }

                    let mainEntities: Array<Entity> = [];
                    if (mainIds) {
                        // flatten all entities
                        for(const [entityName, ids] of Object.entries(mainIds)) {
                            let repo = this.repositoryManager.getRepositoryByClassName(entityName);
                            if(!repo) {
                                // fail('repository not found for ' + entityName);
                                // return;
                                console.warn('repository not found for ' + entityName);
                                continue;
                            }
                            let entities = ids
                                .map((id: string | number) => repo.get(id))
                                .filter((entity: Entity | null) => entity !== null) as Array<Entity>;
                            mainEntities.push(...entities);
                        }
                    } else {
                        // flatten all entities
                        mainEntities = data.reduce((acc: Array<Entity>, {entityName, entities:entitiesData}: {
                            entityName: string,
                            entities: Array<Entity>
                        }) => {
                            let repo = this.repositoryManager.getRepositoryByClassName(entityName);
                            if(!repo) {
                                console.warn('repository not found for ' + entityName);
                                return acc;
                            }
                            let entities = entitiesData
                                .map((entityData: { id:number|string|undefined }) => entityData.id?repo.get(entityData.id):null)
                                .filter((entity: Entity | null) => entity !== null) as Array<Entity>;
                            mainEntities.push(...entities);

                            acc.push(...entities);
                            return acc;
                        }, []);
                    }
                    // let mainEntities:  Array<{ [key: string]: Array<Entity> }>;
                    // if(mainIds) {
                    //     for (const [entityName, entityIds] of Object.entries(mainIds)) {
                    //         console.log(`${entityName}: ${entityIds}`);
                    //         let repo = this.repositoryManager.getRepositoryByEntityName(entityName);
                    //         if(entityIds instanceof Array) {
                    //             mainEntities[entityName] = entityIds.map((id: string) => repo.get(id));
                    //             let entities = entityIds.map((id: string) => repo.get(id));
                    //         }
                    //     }
                    // }
                    resolve({fullData: data, result: mainEntities})
                }).catch((x) => {
                    fail(x)
                });
            }).catch((x) => {
                fail(x)
            });
        })
    }

    remove(data: Array<{
        entityName: string,
        entities: Array<{ [key: string]: any }>
    }>) {
        console.log('removing',data);
        data.forEach(({entityName, entities}) => {
            console.log(entityName,entities);
            const repository = this.repositoryManager.getRepositoryByClassName(entityName);
            entities.forEach(entity => {
                repository.remove(entity.id, false);
            })
            repository.dispatchListChangedEvent();
        })
    }


    private inject(data: Array<{
        entityName: string,
        entities: Array<{ [key: string]: any }>
    }>, isFullUpdate: boolean = false) {
        data.forEach(({entityName, entities}) => {
            // console.log('inject ',entityName,entities)
            const repository = this.repositoryManager.getRepositoryByClassName(entityName);
            if(!repository) {
                console.warn('repository not found for ' + entityName);
                return;
                // throw new Error('repository not found for ' + entityName);
            }

            let beforeIds = repository.getIds();
            let injectedIds: Array<string> = [];

            entities.forEach(entityJson => {
                try {
                    const {entity, action} = repository.addFromJson(entityJson, true, false);
                    entity.repositoryManager = this.repositoryManager;
                    entity._isPersisted = true;
                    this.diffManager.persistOriginal(entity,entityJson);

                    injectedIds.push(entity.getId().toString());
                } catch (e) {
                    console.log(e);
                }
            })

            const addedIds = injectedIds.filter((id: string) => !beforeIds.includes(id));
            let removedIds: Array<string | number> = [];

            if (isFullUpdate) {
                removedIds = beforeIds.filter((id: string) => !injectedIds.includes(id));
                removedIds.forEach((id: string | number) => {
                    repository.remove(id, false);
                });
            }

            if (addedIds.length > 0 || removedIds.length > 0) {
                repository.dispatchListChangedEvent();
            }
            if(injectedIds.length > 0) {
                repository.dispatchEntityChangedEvent(injectedIds);
            }
        })
    }

    private initialize() {
        // const categoryRepository = this.repositoryManager.getRepository(Category);
        // const treeBuilder = new TreeBuilder(categoryRepository);
        // let rootCategories = categoryRepository.filter((category: Category) => category.parentId === null);
        // treeBuilder.buildTree(rootCategories.getItems());
    }
}
