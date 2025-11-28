import {reactive} from "vue";
import EventDispatcher from "./EventDispatcher";
import EntityChangedEvent from "./Event/EntityChangedEvent";
import RepositoryManager from "./RepositoryManager";

interface EntityClass<T extends Entity> {
    new(...args: any[]): T;
}

export default class Entity extends EventDispatcher {
    protected static _properties: { [key: string]: string } = {};
    private static _isReactive: boolean = true;
    public _isPersisted: boolean = false;

    private _repositoryManager: RepositoryManager|null = null;
    private static protectedKeys: Array<string> = ['entityName','_repositoryManager','_isPersisted','_properties','_isReactive'];

    constructor(
        public id: string | null = null
    ) {
        super();
    }

    public getId(): string | null  {
        return this.id;
    }

    setId(id: number | string) {
        this.id = id.toString();
    }

    public get repositoryManager(): RepositoryManager | null {
        return this._repositoryManager;
    }

    set repositoryManager(value: RepositoryManager | null) {
        this._repositoryManager = value;
    }

    protected getRelation<T extends Entity>(theClass: EntityClass<T>, id: string|null): T | null {
        if(null === id || this._repositoryManager === null) {
            return null;
        }
        //TODO : repository en cache
        return this._repositoryManager.getRepository(theClass).get(id) as T;
    }

    protected getOneToMany<T extends Entity>(theClass: EntityClass<T>, relationName: string): Array<T> {
        if(this._repositoryManager === null) {
            console.error('no repository manager');
            return [];
        }
        if(this.id === null) {
            console.error('no id');
            return [];
        }

        let criteria:{[key:string]:string} = {};
        criteria[relationName] = this.id;
        return this._repositoryManager.getRepository(theClass).search(criteria).getItems();
    }


    static getJsonProperties(): { [key: string]: string } {
        return this._properties;
    }

    static isReactive(): boolean {
        return this._isReactive;
    }
    // doStuff<T extends myInterface>(classParameter: T) {
    // static fromJson<T extends Entity>(className: T, json: { [key: string]: any }): Entity {

    // function doStuff0(classParameter: new (...args: any[]) => MyInterface) { }
    // static fromJson(className: new (...args: any[]) => Entity, json: { [key: string]: any }): Entity {
    static buildFromJson(className: any, json: { [key: string]: any }): Entity {
        let converted = this.jsonToEntityData(className, json);

        const entity = new className(json.id);
        for (let key in converted) {
            entity[key] = converted[key];
        }

        // returned entity is reactive, so we can use it in Vue templates
        if(className.isReactive()) {
            return reactive(entity);
        }

        return entity;
    }

    public update(json: { [key: string]: any }, dispatchUpdate: boolean = true) {
        Object.assign(this, json);
        dispatchUpdate && this.dispatchEntityChangedEvent(json);
    }

    public static jsonToEntityData(className: any, json: { [p: string]: any }) {
        let types = className.getJsonProperties();
        let converted: { [key: string]: any } = {};
        for (let key in json) {
            if (key !== 'id') {
                if (types[key] === 'date' && json[key] !== null) {
                    converted[key] = new Date(json[key]);
                    continue;
                }
                converted[key] = json[key];
            }
        }
        return converted;
    }

    toJson(deleteNull: boolean = true): { [key: string]: any } {
        let json: { [key: string]: any } = Object.assign({}, this);
        for (let key in json) {
            if(Entity.protectedKeys.includes(key)) {
                delete json[key];
                continue;
            }
            if(
                (json[key] === null && deleteNull)
                || json[key] instanceof Entity
            ) {
                // console.log('deleting',key,json[key]);
                delete json[key];
                continue;
            }

            // private properties are not serialized
            if(key[0] === '_') {
                delete json[key];
                // call getter if possible
                let realKey = key.substring(1);
                if(Reflect.has(this, realKey)) {
                    json[realKey] = Reflect.get(this,realKey);
                } else {
                    continue;
                }
            }


            // ManyToOne relation
            // if(key.substring(key.length - 2) === 'Id') {
            //     let realKey = key.substring(0, key.length - 2);
            //     json[realKey] = {id:json[key]};
            //     // if(Reflect.has(this, realKey)) {
            //         let value = Reflect.get(this, realKey) as Entity;
            //         // if(Reflect.)
            //         // if(value !== null) {
            //         //     json[realKey] = value.toJson();
            //         // }
            //     // }
            //     delete json[key];
            // }
            //TODO : conversion , universal time ....
            if(json[key] instanceof Date) {
                // console.warn('date',json[key])
                json[key] = json[key].toISOString();
            }
            if(json[key] instanceof Object) {
                // json convert
                json[key] = Object.assign({}, json[key]);
                // console.log("save original",key,json[key]);
            }
        }
        return json;
    }

    private dispatchEntityChangedEvent( updatedData: { [key: string]: any }) {
        let customEvent = new EntityChangedEvent(this, updatedData);
        this.dispatchEvent(customEvent);
    }

    public clone(): this {
        return Object.assign(Object.create(Object.getPrototypeOf(this)), this);

    }
}
