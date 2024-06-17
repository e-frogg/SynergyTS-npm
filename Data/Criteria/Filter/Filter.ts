export default abstract class Filter {
    protected constructor(
        private _field: string,
    ) {
    }

    get field(): string {
        return this._field;
    }

    abstract match(value: any): boolean;
}
