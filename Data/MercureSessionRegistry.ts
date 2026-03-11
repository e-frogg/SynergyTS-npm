import DataLoader from "./DataLoader";
import MercureSessionClient, {MercureSessionSelector} from "./MercureSessionClient";

type SessionId = string;
type SessionMercureUrl = string;

export default class MercureSessionRegistry {
    private sessionId: SessionId|null = null;
    private sessionMercureUrl: SessionMercureUrl|null = null;

    private readonly sourceRegistry: Map<string, Array<string|number>> = new Map();
    private queue: Promise<void> = Promise.resolve();

    constructor(
        private readonly dataLoader: DataLoader,
        private readonly sessionClient: MercureSessionClient,
        private readonly entityName: string,
    ) {
    }

    setSource(sourceKey: string, ids: Array<string|number|null|undefined>): Promise<void> {
        this.sourceRegistry.set(sourceKey, this.normalizeIds(ids));

        return this.enqueueSync();
    }

    clearSource(sourceKey: string): Promise<void> {
        this.sourceRegistry.delete(sourceKey);

        return this.enqueueSync();
    }

    close(): Promise<void> {
        this.sourceRegistry.clear();

        return this.enqueue(async () => {
            await this.closeSession();
        });
    }

    private enqueueSync(): Promise<void> {
        return this.enqueue(async () => {
            await this.syncSession();
        });
    }

    private enqueue(work: () => Promise<void>): Promise<void> {
        const currentWork = this.queue.then(work);
        this.queue = currentWork.catch(() => {
            // keep queue chain alive for next operations
        });

        return currentWork;
    }

    private async syncSession(): Promise<void> {
        const mergedIds = this.getMergedIds();
        if (0 === mergedIds.length) {
            await this.closeSession();

            return;
        }

        const selectors: Array<MercureSessionSelector> = [{
            entity: this.entityName,
            ids: mergedIds,
        }];
        const payload = await this.sessionClient.sync(selectors, this.sessionId);
        const previousMercureUrl = this.sessionMercureUrl;

        this.sessionId = payload.sessionId;
        this.sessionMercureUrl = payload.mercureUrl;
        this.sessionClient.switchSubscriptionWithPrevious(this.dataLoader, payload.mercureUrl, previousMercureUrl);
    }

    private async closeSession(): Promise<void> {
        const sessionId = this.sessionId;
        const sessionMercureUrl = this.sessionMercureUrl;

        this.sessionId = null;
        this.sessionMercureUrl = null;

        if (null === sessionId) {
            if (null !== sessionMercureUrl) {
                this.dataLoader.unsubscribeToMercure(sessionMercureUrl);
            }

            return;
        }

        await this.sessionClient.close(sessionId);
        if (null !== sessionMercureUrl) {
            this.dataLoader.unsubscribeToMercure(sessionMercureUrl);
        }
    }

    /**
     * @return Array<string|number>
     */
    private getMergedIds(): Array<string|number> {
        const mergedSet = new Set<string|number>();
        for (const sourceIds of this.sourceRegistry.values()) {
            for (const id of sourceIds) {
                mergedSet.add(id);
            }
        }

        return Array.from(mergedSet);
    }

    /**
     * @param Array<string|number|null|undefined> ids
     *
     * @return Array<string|number>
     */
    private normalizeIds(ids: Array<string|number|null|undefined>): Array<string|number> {
        const normalizedSet = new Set<string|number>();

        for (const id of ids) {
            if ("string" === typeof id && "" !== id) {
                normalizedSet.add(id);
            }
            if ("number" === typeof id) {
                normalizedSet.add(id);
            }
        }

        return Array.from(normalizedSet);
    }
}

