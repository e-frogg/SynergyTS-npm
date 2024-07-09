import Entity from "./Entity";
import EventDispatcher from "./EventDispatcher";
import ListChangedEvent from "./Event/ListChangedEvent";
import {reactive} from "vue";
import ValueExtractor from "./ValueExtractor";
import Criteria from "./Criteria/Criteria";
import CriteriaConverter from "./Criteria/CriteriaConverter";
import ItemListChangedEvent from "./Event/ItemListChangedEvent";

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

    get(id: string | number | null): EntityType | null {
        if(null === id) {
            return null;
        }
        return this.pk[id] ?? null;
    }

    filter(callback: (entity:EntityType)=>boolean): Repository<EntityType> {
        return new Repository(this._entityClass,this.entities.filter(callback))
    }

    search(criteria: Criteria|{ [key: string]: any }) {
        let realCriteria = (criteria instanceof Criteria) ? criteria : CriteriaConverter.fromBasicCriteria(criteria);
        let items = new Repository(this._entityClass, this.entities.filter(item => this.itemMatch(item, realCriteria)));

        for (let sort of realCriteria.sorts) {
            console.log('sort',sort);
            // items = items.sort(sort.compare);
            items = items.sort(sort.compare.bind(sort));
        }
        // todo : limit
        return items;
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
        let entityId = entity.getId();
        if(null === entityId) {
            console.error('entity id is null');
            return;
        }

        let existing: EntityType | null = this.get(entityId);
        if (existing) {
            console.error('item already with id '+entityId+' exists')
            return;
        }

        this.entities.push(entity);

        // maintainIndex
        this.pk[entityId] = entity;

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
            let entityId = item.getId();
            if(entityId !== null) {
                this.pk[entityId.toString()] = item;
            }
        })
    }

    getIds(): Array<string> {
        return Object.keys(this.pk);
    }

    dispatchListChangedEvent() {
        this.dispatchEvent(new ListChangedEvent(this));
    }
    dispatchEntityChangedEvent(entityIds: Array<string | number>) {
        this.dispatchEvent(new ItemListChangedEvent(this, entityIds));
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

    /**
     * Check if an item match the criteria
     * the item must match every filter
     * if no filter is provided, the item will match
     *
     * @param item
     * @param criteria
     * @private
     */
    private itemMatch(item: EntityType, criteria: Criteria) {
        for (const filter of criteria.filters) {
            let value = ValueExtractor.extractValue(item, filter.field);
            if (!filter.match(value)) {
                return false;
            }
        }
        return true;
    }

}
