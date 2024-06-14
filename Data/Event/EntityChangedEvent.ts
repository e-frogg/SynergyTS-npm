import Entity from "../Entity";

export default class EntityChangedEvent extends Event {
    public static readonly TYPE: string = 'entityChanged';

    constructor(
        public readonly entity: Entity,
        public readonly updatedData: { [key: string]: any },
    ) {
        super(EntityChangedEvent.TYPE);
    }
}
