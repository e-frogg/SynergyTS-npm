import Repository from "./Repository";
import Entity from "./Entity";

interface EntityClass<T extends Entity> {
    new(...args: any[]): T;
}

export default class RepositoryManager {
    private readonly repositories: { [key: string]: Repository<Entity> };
    private readonly entitiesIndex: { [key: string]: EntityClass<Entity> };

    constructor(classes: EntityClass<Entity>[] = []) {
        this.repositories = {};
        this.entitiesIndex = {};
        classes.forEach((cls) => {
            this.addRepository(new Repository(cls));
        });
    }

    addClass<T extends Entity>(theClass: EntityClass<T>): RepositoryManager {
        this.entitiesIndex[theClass.name] = theClass
        return this;
    }
    addRepository(repository: Repository<Entity>): RepositoryManager {
        this.repositories[repository.entityName] = repository;
        return this;
    }

    /*
     * https://2ality.com/2020/04/classes-as-values-typescript.html#a-generic-type-for-classes%3A-class%3Ct%3E
     */
    getRepository<T extends Entity>(theClass: EntityClass<T>): Repository<T> {
        return this.repositories[theClass.name] as Repository<T>;
    }

    getRepositoryByClassName<T extends Entity>(className: string): Repository<T> {
        return this.repositories[className] as Repository<T>;
    }
    getRepositoryByEntityName(entityName: string): Repository<Entity> {
        return this.getRepository(this.stringToClass(entityName)) as Repository<Entity>;
    }

    stringToClass(entityName: string): EntityClass<Entity> {
        return this.entitiesIndex[entityName];
    }

    classToString<T extends Entity>(theClass: EntityClass<T>): string {
        return theClass.name;
    }

    getRepositories(): { [key: string]: Repository<Entity> } {
        return this.repositories;
    }

    public each(callback: any): void {
        Object.values(this.repositories).map(callback)
    }
    public map(callback: (value: Repository<Entity>, index: number, array: Repository<Entity>[]) => Repository<Entity>): Repository<Entity>[] {
        return Object.values(this.repositories).map(callback)
    }
}
