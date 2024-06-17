import Entity from "../Entity";
import Repository from "../Repository";

/**
 * Event dispatched when one or more items in a repository has changed.
 */
export default class ItemListChangedEvent extends Event {
    public static readonly TYPE: string = 'ItemListChangedEvent';

    constructor(
        public readonly repository: Repository<Entity>,
        public readonly entityIds: Array<string | number>,
    ) {
        super(ItemListChangedEvent.TYPE);
    }
}
