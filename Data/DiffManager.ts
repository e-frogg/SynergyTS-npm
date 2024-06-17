import Entity from "./Entity";

export default class DiffManager {

    private original: { [key: string]: { [key: string]: any } } = {};

    // TODO : améliorer out ça !!!
    // TODO : améliorer out ça !!!
    // TODO : améliorer out ça !!!
    public persistOriginal(entity: Entity,entityJson: { [key: string]: any }): void {
        // this.original[entity.getId()] = entityJson;
        this.original[entity.getId()] = entity.toJson();
    }

    public computeDiff(entity: Entity): { [key: string]: any } {
        const original = this.original[entity.getId()];
        const current = entity.toJson();
        return this.diff(original,current);
    }

    private diff(original: { [key: string]: any },current: { [key: string]: any }): { [key: string]: any } {
        if(!original) {
            return current;
        }

        let diff: { [key: string]: any } = {};
        for(let key in current) {
            if(current[key] !== original[key]) {
                // console.log('diff',key,current[key],original[key])
                diff[key] = current[key];
            }
        }
        return diff;
    }
}
