import Entity from "../Entity";
import Repository from "../Repository";

export default class ListChangedEvent extends Event {
    public static readonly TYPE: string = 'ListChanged';

    constructor(
        public readonly repository: Repository<Entity>
    ) {
        super(ListChangedEvent.TYPE);
    }
}
