import { ClientConnection } from '@server/net/client-connection';
import { ByteBuffer } from '@runejs/byte-buffer';

export abstract class DataParser {

    public constructor(protected readonly clientConnection: ClientConnection) {
    }

    public abstract async parse(buffer?: ByteBuffer, packetId?: number): Promise<void | boolean>;

}
