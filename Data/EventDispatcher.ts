export default class EventDispatcher {
    private eventDispatcher: any;

    constructor() {
        this.eventDispatcher = document.createElement('div');
    }

    addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void {
        this.eventDispatcher.addEventListener(type, callback, options);
    }

    removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean): void {
        this.eventDispatcher.removeEventListener(type, callback, options);
    }

    dispatchEvent(event: Event): boolean {
        return this.eventDispatcher.dispatchEvent(event);
    }

}
