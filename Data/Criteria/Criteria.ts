import Sort from "./Sort/Sort";
import {Filter} from "./Filter/Filter";

export interface CriteriaAssociations {
    [index: string]: Criteria;
}

export default class Criteria {
    private _filters: Array<Filter> = [];
    private _sorts: Array<Sort> = [];
    private _associations: CriteriaAssociations = {};
    private _limit: number | null = null
    private _offset: number | null = null
    private _totalCount: boolean = false;


    constructor(
        private ids: null|Array<string> = null,
    ) {
    }
    withAssociation(path: string): this {
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
    withFilter(filter: Filter): this {
        this._filters.push(filter);
        return this;
    }

    withSort(sort: Sort): this {
        this._sorts.push(sort);
        return this;
    }

    withLimit(limit: number | null): this {
        this._limit = limit;
        return this;
    }

    withOffset(offset: number | null): this {
        this._offset = offset;
        return this;
    }

    getIds(): Array<string>|null {
        return this.ids;
    }

    withIds(ids: null|Array<string>) {
        this.ids = ids;
        return this;
    }

    withTotalCount(totalCount: boolean): this {
      this._totalCount = totalCount;
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

    get totalCount(): boolean {
      return this._totalCount;
    }

}
