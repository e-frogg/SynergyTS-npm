import Entity from "./Entity";
import DataLoader from "./DataLoader";
import RepositoryManager from "./RepositoryManager";
import Repository from "./Repository";
import DiffManager from "./DiffManager";
import Criteria from "./Criteria/Criteria";
import CriteriaConverter from "./Criteria/CriteriaConverter";

interface EntityClass<T extends Entity> {
    new(...args: any[]): T;
}

import dataLoadResult from "./DataLoader";

export default class EntityManager {

    private readonly _dataLoader: DataLoader;
    private readonly _diffManager: DiffManager;
    constructor(
        private readonly _repositoryManager: RepositoryManager,
        public apiBaseUrl: string = '/synergy/entity'
    ) {
        this._diffManager = new DiffManager();
        this._dataLoader = new DataLoader(_repositoryManager, this._diffManager);
    }

    get dataLoader(): DataLoader {
        return this._dataLoader
    }

    get repositoryManager(): RepositoryManager {
        return this._repositoryManager;
    }

    delete(entity: Entity): Promise<Entity> {
        let entityType = entity.constructor.name;

        return new Promise((resolve, reject) => {
            let entityId = entity.getId();
            if(null === entityId) {
                reject('Entity has no id');
                return;
            }
            fetch(this.getEntityUrl(entityType, entityId), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
            }).then(response => {
                resolve(entity);
            }).catch(error => {
                console.log(error);
                reject(error);
            })
        });
    }
    update(entity: Entity, update: {[key: string]:any}): Promise<Entity> {
        let entityType = entity.constructor.name;
        // delete json.id;

        return new Promise((resolve, reject) => {
          let entityId = entity.getId();
            let url = entity._isPersisted && null !== entityId
                ? this.getEntityUrl(entityType, entityId)
                : this.getCollectionUrl(entityType);
            let method = entity._isPersisted ? 'PUT' : 'POST';
            fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(update)
            }).then(response => {
                response.json().then
                (data => {
                    let id = data.id;
                    //TODO : mettre l'entity dans le repository, avant ou après,
                    // mais il faudrait que l'entity qui est dans le repository
                    // soit la même que celle qui est fournie ici
                    entity.setId(id);
                    resolve(entity);
                })
            }).catch(error => {
                console.error(error);
                reject(error);
            })
            console.log(`Saving ${entityType} to the database: ${update}`)

        });
        // return new Promise()
    }
    public save(entity: Entity): Promise<Entity> {
        // save entity to the database
        let diff = this._diffManager.computeDiff(entity);
        if(Object.keys(diff).length === 0) {
            return new Promise((resolve, reject) => {
                resolve(entity);
            });
        }
        return this.update(entity, diff);
    }
    public saveMultiple(entities: Entity[]): Promise<Entity[]> {
        return Promise.all(entities.map(entity => this.save(entity)));
    }

    search<T extends Entity>(theClass: EntityClass<T>, criteria?: Criteria): Promise<dataLoadResult> {
        criteria ??= new Criteria();
        console.debug( 'search',this.getSearchUrl(theClass.name),
            CriteriaConverter.toJson(criteria));
        return this.load(
            this.getSearchUrl(theClass.name),
            CriteriaConverter.toJson(criteria),
            'POST'
        )
    }

    private getCollectionUrl(entityType: string) {
        return `${this.apiBaseUrl}/${entityType}`;
    }
    private getEntityUrl(entityType: string, id: string ) {
        return this.getCollectionUrl(entityType)+`/${id}`;
    }
    private getSearchUrl(entityType: string): string {
        return `${this.apiBaseUrl}/search/${entityType}`;
    }
    private getActionUrl(entityType: string, action: string) {
        return this.getCollectionUrl(entityType)+`/${action}`;
    }

    static toSnakeCase(str: string) {
        return str.split(/(?=[A-Z])/).join('_').toLowerCase();
    }

    // forward to dataLoader
    public load( url: string, data: object | null = null, method: string = 'GET'): Promise<dataLoadResult> {
        return new Promise((resolve, reject) => {
            this.dataLoader.load(url, data, method).then((event) => {
                resolve(event);
            }).catch(error => {
                console.log(error);
                reject(error);
            });
        });
    }

    // forward to repositoryManager
    getRepository<T extends Entity>(theClass: EntityClass<T>): Repository<T> {
        return this.repositoryManager.getRepository(theClass);
    }

    public clear() {
        this.repositoryManager.each((repository: Repository<any>) => {
            repository.clear();
        });
    }
}
