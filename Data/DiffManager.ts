import Entity from "./Entity";

export default class DiffManager {

    private original: { [key: string]: { [key: string]: any } } = {};

    public persistOriginal(entity: Entity,entityJson: { [key: string]: any }): void {
        this.original[this.getCacheKey(entity)] = entity.toJson();
    }

    public computeDiff(entity: Entity): { [key: string]: any } {
        const original = this.original[this.getCacheKey(entity)];
        const current = entity.toJson();
        return this.diff(original,current);
    }

    private getCacheKey(entity: Entity) {
        return entity.constructor.name+"-"+entity.getId();
    }

    private diff(original: { [key: string]: any },current: { [key: string]: any }): { [key: string]: any } {
        if(!original) {
            return current;
        }

        let diff: { [key: string]: any } = {};
        for(let key in current) {
            if(key.startsWith('_')) {
                continue;
            }

            let c = current[key];
            let o = original[key];
            // if(c instanceof Object) {
            //     console.log('c',key,c)
                // c = JSON.stringify(Object.assign({}, c));
            // }
            // if(o instanceof Object) {
            //     console.log('o',key,o)
                // o = JSON.stringify(Object.assign({}, o));
            // }
            if(c !== o) {
                // console.log('diff',key,c,o)
                diff[key] = current[key];
            // } else {
                // console.log('same',key,c,o)
            }
        }
        return diff;
    }
}
