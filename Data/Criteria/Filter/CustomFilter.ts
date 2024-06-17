import Filter from "./Filter";

export default class CustomFilter extends Filter {
    constructor(field: string, private callback: Function) {
        super(field);
    }

    match(value: any): boolean {
        return this.callback(value);
    }
}
