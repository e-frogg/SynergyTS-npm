import Criteria from "./Criteria";
import CustomFilter from "./Filter/CustomFilter";
import Filter from "./Filter/Filter";
import EqualsFilter from "./Filter/EqualsFilter";

export default class CriteriaConverter {
    static convertCriteria(basicCriteria: { [key: string]: any }): Criteria {
        let criteria = new Criteria();
        for (let field in basicCriteria) {
            let expected = basicCriteria[field];
            // if expected is a function, call it
            // ex : (name) => name.startsWith('A')
            let typeOfExpected = typeof expected;
            if (typeOfExpected === 'function') {
                criteria.addFilter(new CustomFilter(field, expected));
            } else if (typeOfExpected === 'object' && expected instanceof Filter) {
                criteria.addFilter(expected);
            //todo : array => equalsAnyFilter
            } else if (typeOfExpected === 'string' || typeOfExpected === 'number') {
                criteria.addFilter(new EqualsFilter(field, expected));
            } else {
                throw new Error('invalid criteria type : ' + typeOfExpected);
            }
        }
        return criteria;
    }
}
