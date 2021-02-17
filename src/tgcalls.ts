import { Chat } from 'typegram';
import { exec as _exec, spawn } from 'child_process';
import { JoinVoiceCallResponse } from 'tgcalls/lib/types';
import { promisify } from 'util';
import { Stream, TGCalls } from 'tgcalls';
import env from './env';
import WebSocket from 'ws';
import { Readable } from 'stream';

const exec = promisify(_exec);

interface CachedConnection {
    connection: TGCalls<{ chat: Chat.SupergroupChat }>;
    stream: Stream;
    queue: string[];
    joinResolve?: (value: JoinVoiceCallResponse) => void;
}

const ws = new WebSocket(env.WEBSOCKET_URL);
const cache = new Map<number, CachedConnection>();

const ffmpegOptions = ['-c', 'copy', '-acodec', 'pcm_s16le', '-f', 's16le', '-ac', '1', '-ar', '65000', 'pipe:1'];

ws.on('message', response => {
    const { _, data } = JSON.parse(response.toString());

    switch (_) {
        case 'get_join': {
            const connection = cache.get(data.chat_id);
            if (connection) {
                connection.joinResolve?.(data);
            }

            break;
        }

        default:
            break;
    }
});

const downloadSong = async (url: string): Promise<Readable> => {
    return new Promise(resolve => {
        const ytdlChunks: string[] = [];
        const ytdl = spawn('youtube-dl', [
            '--extract-audio',
            '--get-url',
            url.replace(/'/g, `'"'"'`),
        ]);

        ytdl.stderr.on('data', data => console.error(data.toString()));

        ytdl.stdout.on('data', data => {
            ytdlChunks.push(data.toString());
        });

        ytdl.on('exit', () => {
            const input = ytdlChunks.join('\n').trim();
            const ffmpeg = spawn('ffmpeg', ['-y', '-i', input, ...ffmpegOptions]);

            resolve(ffmpeg.stdout);
        });
    });
};

const createConnection = async (chat: Chat.SupergroupChat): Promise<void> => {
    if (cache.has(chat.id)) {
        return;
    }

    const connection = new TGCalls({ chat });
    const stream = new Stream();
    const queue: string[] = [];

    const cachedConnection: CachedConnection = {
        connection,
        stream,
        queue,
    };

    connection.joinVoiceCall = payload => {
        return new Promise(resolve => {
            cachedConnection.joinResolve = resolve;

            const data = {
                _: 'join',
                data: {
                    ufrag: payload.ufrag,
                    pwd: payload.pwd,
                    hash: payload.hash,
                    setup: payload.setup,
                    fingerprint: payload.fingerprint,
                    source: payload.source,
                    chat: payload.params.chat,
                },
            };
            ws.send(JSON.stringify(data));
        });
    };

    cache.set(chat.id, cachedConnection);
    await connection.start(stream.createTrack());

    stream.on('finish', async () => {
        if (queue.length > 0) {
            const url = queue.shift()!;
            const readable = await downloadSong(url);
            stream.setReadable(readable);
        }
    });
};

export const addToQueue = async (chat: Chat.SupergroupChat, url: string): Promise<number | null> => {
    if (!cache.has(chat.id)) {
        await createConnection(chat);
        return addToQueue(chat, url);
    }

    const { stream, queue } = cache.get(chat.id)!;

    if (stream.finished) {
        const readable = await downloadSong(url);
        stream.setReadable(readable);
        return 0;
    }

    return queue.push(url);
};

export const getQueue = (chatId: number): string[] | null => {
    if (cache.has(chatId)) {
        const { queue } = cache.get(chatId)!;
        return Array.from(queue);
    }

    return null;
};

export const pause = (chatId: number): boolean | null => {
    if (cache.has(chatId)) {
        const { stream } = cache.get(chatId)!;
        stream.pause();
        return stream.paused;
    }

    return null;
};

export const skip = (chatId: number): boolean => {
    if (cache.has(chatId)) {
        const { stream } = cache.get(chatId)!;
        stream.finish();
        stream.emit('finish');
        return true;
    }

    return false;
};
