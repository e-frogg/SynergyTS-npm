import Filter from "./Filter";

export default class EqualsFilter extends Filter {
    constructor(field: string, public readonly value: any) {
        super(field);
    }

    match(value: any): boolean {
        return value === this.value;
    }
}
