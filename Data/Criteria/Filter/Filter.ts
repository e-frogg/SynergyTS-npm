export abstract class Filter {
    protected constructor(
        private _field: string,
    ) {
    }

    get field(): string {
        return this._field;
    }

    abstract match(value: any): boolean;

  abstract toJson(): any;
}

export class EqualsFilter extends Filter {
    constructor(field: string, public readonly value: any) {
        super(field);
    }

    match(value: any): boolean {
        return value === this.value;
    }

  toJson(): any {
    return {[this.field]: this.value};
  }
}

export class EqualsAnyFilter extends Filter {
    constructor(field: string, public readonly values: any[]) {
        super(field);
    }

    match(value: any): boolean {
        return this.values.includes(value);
    }

  toJson(): any {
    return {[this.field]: this.values};
  }
}


export class CustomFilter extends Filter {
  constructor(field: string, private callback?: Function) {
        super(field);
    }

    match(value: any): boolean {
      if (null == this.callback) {
        throw new Error('CustomFilter requires a callback function');
      }
        return this.callback(value);
    }

  toJson(): any {
    throw new Error('CustomFilter cannot be converted to json');
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

  toJson(): any {
    return {
      [this.field]: {
        'type': 'contains',
        'value': this.value
      }
    };
  }

}

export class OrFilter extends Filter {
    constructor(public readonly filters: Filter[]) {
        super('or');
    }

    match(value: any): boolean {
        return this.filters.some((filter) => filter.match(value));
    }

  toJson(): any {
    return {
      'or': this.filters.map((innerFilter: Filter) => innerFilter.toJson())
    }
  }
}

export class AndFilter extends Filter {
    constructor(public readonly filters: Filter[]) {
        super('and');
    }

    match(value: any): boolean {
        return this.filters.every((filter) => filter.match(value));
    }

  toJson(): any {
    return {
      'and': this.filters.map((innerFilter: Filter) => innerFilter.toJson())
    }
  }
}
