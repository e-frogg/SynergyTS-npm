import Sort from "./Sort/Sort";
import Filter from "./Filter/Filter";

export default class Criteria {
    private _filters: Array<Filter> = [];
    private _sorts: Array<Sort> = [];

    addFilter(filter: Filter): this {
        this._filters.push(filter);
        return this;
    }

    addSort(sort: Sort): this {
        this._sorts.push(sort);
        return this;
    }

    get filters(): Array<Filter> {
        return this._filters;
    }

    get sorts(): Array<Sort> {
        return this._sorts;
    }

}
