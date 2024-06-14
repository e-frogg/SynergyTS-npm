export default class DataLoadedEvent extends Event {
    public static readonly TYPE: string = 'dataLoaded';

    constructor(
        private readonly data: {}
    ) {
        super(DataLoadedEvent.TYPE);
    }
}
