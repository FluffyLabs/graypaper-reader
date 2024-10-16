import {createWriteStream, WriteStream} from "fs";

export class MessagesLogger {
    private readonly file: WriteStream;

    constructor(
        private readonly roomId: string,
        fileName: string
    ) {
        this.file = createWriteStream(fileName, {
            encoding: 'utf8',
            flags: 'a+',
            flush: true,
        });
    }

    private generatePermalink(eventId: string): string {
        return `https://matrix.to/#/${this.roomId}/${eventId}`;
    }

    onMessage(msg: string, sender: string = 'unknown', eventId: string | undefined, date: Date | null) {
        if (!eventId) {
            return;
        }
        if (!msg.includes("graypaper.fluffylabs.dev")) {
            return;
        }

        const link = this.generatePermalink(eventId);

        this.file.write(JSON.stringify({
            date,
            sender,
            link,
            msg,
        }));
        this.file.write(',\n');
    }

    flush() {
        this.file.end();
    }
}
