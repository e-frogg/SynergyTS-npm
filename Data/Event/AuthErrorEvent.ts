export default class AuthErrorEvent extends Event {
    public static readonly TYPE: string = 'auth:error';

    constructor(
        public readonly response: Response
    ) {
        super(AuthErrorEvent.TYPE);
    }
}
