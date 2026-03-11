import DataLoader from "./DataLoader";

export type MercureSessionSelector = {
    entity: string,
    ids: Array<number|string>
};

export type MercureSessionResponse = {
    sessionId: string,
    mercureUrl: string,
    topic?: string,
    expiresAt?: number
};

export default class MercureSessionClient {
    constructor(
        private readonly baseEndpoint: string = '/synergy/entity/mercure-session',
    ) {
    }

    async sync(
        selectors: Array<MercureSessionSelector>,
        currentSessionId: string|null = null
    ): Promise<MercureSessionResponse> {
        const method = null === currentSessionId ? 'POST' : 'PUT';
        const endpoint = null === currentSessionId
            ? this.baseEndpoint
            : `${this.baseEndpoint}/${currentSessionId}`;

        const response = await fetch(endpoint, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({selectors}),
        });
        if (!response.ok) {
            throw new Error(`failed to sync mercure session (${response.status})`);
        }

        return await response.json() as MercureSessionResponse;
    }

    async close(sessionId: string): Promise<void> {
        const response = await fetch(`${this.baseEndpoint}/${sessionId}`, {
            method: 'DELETE',
        });

        if (!response.ok && 404 !== response.status) {
            throw new Error(`failed to close mercure session (${response.status})`);
        }
    }

    switchSubscription(dataLoader: DataLoader, mercureUrl: string): void {
        dataLoader.subscribeToMercure(mercureUrl);
    }

    switchSubscriptionWithPrevious(dataLoader: DataLoader, mercureUrl: string, previousMercureUrl: string|null): void {
        if (previousMercureUrl === mercureUrl) {
            return;
        }
        if (null !== previousMercureUrl) {
            dataLoader.unsubscribeToMercure(previousMercureUrl);
        }
        dataLoader.subscribeToMercure(mercureUrl);
    }
}
