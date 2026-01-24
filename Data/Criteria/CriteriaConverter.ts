import Criteria, {CriteriaAssociations} from "./Criteria";
import {CustomFilter, Filter, EqualsFilter, EqualsAnyFilter, ContainsFilter} from "./Filter/Filter";
import FieldSort from "./Sort/FieldSort";

interface JsonCriteria {
    filters?: JsonFilters;
    associations?: JsonAssociations;
    orderBy?: JsonOrderBy;
    offset?: number;
    limit?: number;
    ids?: Array<string | number>;
    totalCount?: boolean;
}

interface JsonAssociations {
    [key: string]: JsonCriteria;
}
interface JsonOrderBy {
    [key: string]: string;
}

interface JsonFilters {
    [key: string]: any;
}

export interface BasicCriteria {
    [key: string]: any;
}

export default class CriteriaConverter {
    static fromBasicCriteria(basicCriteria: BasicCriteria): Criteria {
        let criteria = new Criteria();
        for (let field in basicCriteria) {
            let expected = basicCriteria[field];
            // if expected is a function, call it
            // ex : (name) => name.startsWith('A')
            let typeOfExpected = typeof expected;
            if (typeOfExpected === 'function') {
                criteria.withFilter(new CustomFilter(field, expected));
            } else if (typeOfExpected === 'object' && expected instanceof Filter) {
                criteria.withFilter(expected);
            } else if (typeOfExpected === 'object' && expected instanceof Array) {
                criteria.withFilter(new EqualsAnyFilter(field, expected));
            } else if (typeOfExpected === 'string' || typeOfExpected === 'number') {
                criteria.withFilter(new EqualsFilter(field, expected));
            } else {
                throw new Error('invalid criteria type : ' + typeOfExpected);
            }
        }
        return criteria;
    }

    static toJson(criteria: Criteria): {} {
        let filters: JsonFilters = {};
        for (const filter of criteria.filters) {
            if (filter instanceof EqualsFilter) {
                filters[filter.field] = filter.value;
            } else if (filter instanceof EqualsAnyFilter) {
                filters[filter.field] = filter.values
            } else if (filter instanceof ContainsFilter) {
                filters[filter.field] = {
                  'type': 'contains',
                  'value': filter.value
                }
            } else {
                throw new Error('could not convert Filter to json ' + filter.constructor.name)
            }
        }

        let orderBy: JsonOrderBy = {}
        for (const sort of criteria.sorts) {
            if (sort instanceof FieldSort) {
                orderBy[sort.field] = sort.direction
            } else {
                throw new Error('could not convert Sort to json ' + sort.constructor.name)
            }
        }
        let json: JsonCriteria = {};

        let ids = criteria.getIds();
        if(ids && ids.length > 0) {
          json['ids'] = ids;
        }

        if (Object.keys(filters).length > 0) {
            json['filters'] = filters;
        }
        if (Object.keys(orderBy).length > 0) {
            json['orderBy'] = orderBy;
        }
        if (criteria.offset && criteria.offset > 0) {
            json['offset'] = criteria.offset;
        }
        if (criteria.limit !== null) {
            json['limit'] = criteria.limit;
        }
        if (criteria.totalCount) {
            json['totalCount'] = criteria.totalCount;
        }
        if(criteria.associations && Object.keys(criteria.associations).length > 0) {
            json['associations'] = CriteriaConverter.associationToJson(criteria.associations);
        }
        return json;
    }

    static associationToJson(associations: CriteriaAssociations): any {
        let json: JsonAssociations = {}
        Object.entries(associations).forEach(([associationName, associationCriteria]) => {
            json[associationName] = CriteriaConverter.toJson(associationCriteria)
        });
        return json;
    }
}
