import Sort from "./Sort/Sort";
import Filter from "./Filter/Filter";

export interface CriteriaAssociations {
    [index: string]: Criteria;
}

export default class Criteria {
    private _filters: Array<Filter> = [];
    private _sorts: Array<Sort> = [];
    private _associations: CriteriaAssociations = {};
    private _limit: number | null = null
    private _offset: number | null = null
    private _autoSync: boolean = false;


    constructor(
        private ids: null|Array<number|string> = null,
    ) {
    }
    addAssociation(path: string): this {
        this.getAssociation(path)

        return this;
    }

    getAssociation(path: string): Criteria {
        let chunks = path.split('.');

        let associationName: string = chunks.shift() ?? '';

        let association = this._associations[associationName]
        if (!association) {
            this._associations[associationName] = new Criteria()
            association = this._associations[associationName]
        }

        if (chunks.length > 0) {
            return association.getAssociation(chunks.join('.'))
        }
        return association;
    }
    addFilter(filter: Filter): this {
        this._filters.push(filter);
        return this;
    }

    addSort(sort: Sort): this {
        this._sorts.push(sort);
        return this;
    }

    setLimit(limit: number | null): this {
        this._limit = limit;
        return this;
    }

    setAutoSync(autoSync: boolean): this {
        this._autoSync = autoSync;
        return this;
    }

    get autoSync(): boolean {
        return this._autoSync;
    }

    setOffset(offset: number | null): this {
        this._offset = offset;
        return this;
    }

    getIds(): Array<string|number>|null {
        return this.ids;
    }

    setIds(ids: null|Array<number|string>) {
        this.ids = ids;
        return this;
    }

    get filters(): Array<Filter> {
        return this._filters;
    }

    get sorts(): Array<Sort> {
        return this._sorts;
    }

    get associations(): { [index: string]: Criteria } {
        return this._associations;
    }

    get limit(): number | null {
        return this._limit;
    }

    get offset(): number | null {
        return this._offset;
    }

    check() {
        if(this._autoSync && null !== this._limit) {
            throw new Error('AutoSync and limit are not compatible');
        }
    }
}
