import Filter from "./Filter";

export default class ContainsFilter extends Filter {
    constructor(field: string, public readonly value: string) {
        super(field);
        this.value = value.toLowerCase();
    }

    match(value: any): boolean {
        return value.toString().toLowerCase().includes(this.value.toString());
    }
}
