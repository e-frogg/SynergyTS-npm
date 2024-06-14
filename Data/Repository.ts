import Entity from "./Entity";
import EventDispatcher from "./EventDispatcher";
import ListChangedEvent from "./Event/ListChangedEvent";
import {reactive} from "vue";

export default class Repository<EntityType extends Entity> extends EventDispatcher implements Iterable<Entity>{

    public static LIST_CHANGED_EVENT: string = 'listChanged';

    private pk: { [key: string | number]: EntityType } = {};

    // reactive and readonly => vue.js reactivity
    private readonly entities:EntityType[] = reactive([]);

    constructor(
        private _entityClass: any = Entity,
        items: EntityType[]|null= null,
    ) {
        super();
        if(items) {
            this.addItems(items);
        }
    }

    get entityName(): string {
        return this._entityClass.name
    }

    getItems(): EntityType[] {
        return this.entities;
    }

    get(id: string | number): EntityType | null {
        return this.pk[id] ?? null;
    }

    getItemBy(criteria: { [key: string]: any }): EntityType | null {
        return this.entities.find((item: EntityType) => this.itemMatch(item, criteria))??null;
    }

    filter(callback: (entity:EntityType)=>boolean): Repository<EntityType> {
        return new Repository(this._entityClass,this.entities.filter(callback))
    }

    private itemMatch(item: EntityType, criteria: { [key: string]: any }) {
        for (let key in criteria) {
            if (item[key as keyof EntityType] !== criteria[key]) {
                return false
            }
        }
        return true;
    }

    findItemsBy(criteria: object): Repository<EntityType> {
        return new Repository(this._entityClass,this.entities.filter(item => this.itemMatch(item, criteria)));
    }

    map(callback: any): any {
        return this.entities.map(callback)
    }

    sort(callback: any): Repository<EntityType> {
        return new Repository(this._entityClass,this.entities.sort(callback))
    }

    remove(id: string | number, dispatchUpdate: boolean = true): void {
        let index = this.entities.findIndex((item: EntityType) => item.id === id)
        if (index === -1) {
            return;
        }
        this.entities.splice(index, 1);
        // this.items = this.items.filter((item: EntityType) => item.id !== id)
        // maintainIndex
        delete this.pk[id];

        // dispatch update event
        dispatchUpdate && this.dispatchListChangedEvent();
    }

    add(entity: EntityType, dispatchUpdate: boolean = true): void {
        // remplace existing item
        let existing: EntityType | null = this.get(entity.getId());
        if (existing) {
            console.error('item already with id '+entity.getId()+' exists')
            return;
        }

        this.entities.push(entity);

        // maintainIndex
        this.pk[entity.getId()] = entity;

        // dispatch update event
        dispatchUpdate && this.dispatchListChangedEvent();
    }

    addFromJson(json: { [key: string]: any }, allowUpdate: boolean = false, dispatchUpdate: boolean = true): {entity:EntityType,action:"add"|"update"} {
        if (allowUpdate) {
            // looking for existing item
            let id = json.id;
            if (!id) {
                throw new Error('id is required');
            }
            let existing: EntityType | null = this.get(id);
            if (existing) {

                // let content = Entity.jsonToEntityData(this._entityClass, json);
                // for (let key in content) {
                //     existing[key] = content[key];
                // }
                existing.update(Entity.jsonToEntityData(this._entityClass, json),dispatchUpdate);
                return {entity:existing,action:'update'};
            }
        }

        // creating new item
        let entity: any = Entity.buildFromJson(this._entityClass, json)
        this.add(entity, dispatchUpdate);
        return {entity,action:'add'};
    }

    updateFromJson(id: string, json: any, dispatchUpdate: boolean = true): void {
        let entity: any = Entity.buildFromJson(this._entityClass, json)
        this.add(entity, dispatchUpdate);
    }

    public clear(dispatchUpdate: boolean = true) {
        this.entities.splice(0, this.entities.length);
        this.updateIndex();
        dispatchUpdate && this.dispatchListChangedEvent();
    }

    private updateIndex() {
        this.pk = {};
        this.entities.forEach((item: EntityType) => {
            this.pk[item.getId().toString()] = item;
        })
    }

    getIds(): Array<string> {
        return Object.keys(this.pk);
    }

    dispatchListChangedEvent() {
        let customEvent = new ListChangedEvent(this);
        this.dispatchEvent(customEvent);
    }

    private addItems(items: EntityType[]) {
        this.entities.push(...items);
        this.updateIndex();
    }

    [Symbol.iterator]() {
        let pointer = 0;
        let components = this.entities;

        return {
            next(): IteratorResult<EntityType> {
                if (pointer < components.length) {
                    return {
                        done: false,
                        value: components[pointer++]
                    }
                } else {
                    return {
                        done: true,
                        value: null
                    }
                }
            }
        }
    }

    first(): EntityType | null{
        return this.entities[0]??null;
    }
}
