export default class EventDispatcher {
    private _eventDispatcher: any;

    constructor() {
        this._eventDispatcher = document.createElement('div');
    }

    addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void {
        this._eventDispatcher.addEventListener(type, callback, options);
    }

    removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean): void {
        this._eventDispatcher.removeEventListener(type, callback, options);
    }

    dispatchEvent(event: Event): boolean {
        return this._eventDispatcher.dispatchEvent(event);
    }

}
