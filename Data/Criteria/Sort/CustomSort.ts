import Sort from "./Sort";

export default class CustomSort extends Sort {
    constructor(
        private _compare: (a: any, b: any) => number,
    ) {
        super();
    }

    compare(a: any, b: any): number {
        return this._compare(a, b);
    };
}
