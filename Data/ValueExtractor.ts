export default class ValueExtractor {
    public static extractValue(item: any, key: string): any {
        // key can be a path
        // example: 'user.name'

        let parts = key.split('.');
        let value = item;
        for (let part of parts) {
            value = value[part] ?? null;
            if (value === null) {
                return null;
            }
        }

        // if value is a function, call it
        // ex : 'user.name' => item.user.name
        if (typeof value === 'function') {
            return value();
        }

        return value;
    }
}
