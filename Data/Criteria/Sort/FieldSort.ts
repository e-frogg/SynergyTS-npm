import ValueExtractor from "../../ValueExtractor";
import Sort from "./Sort";

export default class FieldSort extends Sort{
    constructor(
        private _field: string,
        private _direction: 'asc' | 'desc' = 'asc',
    ) {
        super();
    }

    get field(): string {
        return this._field;
    }

    get direction(): 'asc' | 'desc' {
        return this._direction;
    }

    compare(a: any, b: any): number {
        let aValue = ValueExtractor.extractValue(a, this._field);
        let bValue = ValueExtractor.extractValue(b, this._field);
        if (aValue < bValue) {
            return this._direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return this._direction === 'asc' ? 1 : -1;
        }
        return 0;
    };
}
