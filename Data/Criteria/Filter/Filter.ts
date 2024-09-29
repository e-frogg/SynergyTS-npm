export abstract class Filter {
    protected constructor(
        private _field: string,
    ) {
    }

    get field(): string {
        return this._field;
    }

    abstract match(value: any): boolean;
}


export class EqualsFilter extends Filter {
    constructor(field: string, public readonly value: any) {
        super(field);
    }

    match(value: any): boolean {
        return value === this.value;
    }
}

export class EqualsAnyFilter extends Filter {
    constructor(field: string, public readonly values: any[]) {
        super(field);
    }

    match(value: any): boolean {
        return this.values.includes(value);
    }
}


export class CustomFilter extends Filter {
    constructor(field: string, private callback: Function) {
        super(field);
    }

    match(value: any): boolean {
        return this.callback(value);
    }
}


export  class ContainsFilter extends Filter {
    constructor(field: string, public readonly value: string) {
        super(field);
        this.value = value.toLowerCase();
    }

    match(value: any): boolean {
        return value.toString().toLowerCase().includes(this.value.toString());
    }
}
