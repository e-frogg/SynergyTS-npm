import Filter from "./Filter";

export default class EqualsAnyFilter extends Filter {
    constructor(field: string, public readonly values: any[]) {
        super(field);
    }

    match(value: any): boolean {
        return this.values.includes(value);
    }
}
