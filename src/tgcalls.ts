import { Chat } from '@grammyjs/types';
import { Stream, TGCalls } from 'tgcalls';
import { getJoinCall } from 'gram-tgcalls/lib/calls';
import ytdl from 'ytdl-core-telegram';
import { client } from './client';
import { Readable } from 'stream';

interface DownloadedSong {
    stream: Readable;
    info: {
        id: string;
        title: string;
        duration: number;
    };
}

interface CachedConnection {
    connection: TGCalls<{ chat: Chat.SupergroupChat }>;
    stream: Stream;
    queue: string[];
    currentSong: DownloadedSong['info'] | null;
}

const cache = new Map<number, CachedConnection>();

const downloadSong = async (url: string): Promise<DownloadedSong> => {
    const info = await ytdl.getInfo(url);

    return {
        stream: ytdl.downloadFromInfo(info),
        info: {
            id: info.videoDetails.videoId,
            title: info.videoDetails.title,
            duration: Number(info.videoDetails.lengthSeconds),
        },
    };
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
        currentSong: null,
    };

    connection.joinVoiceCall = getJoinCall(client, chat.id);

    cache.set(chat.id, cachedConnection);
    await connection.start(stream.createTrack());

    stream.on('finish', async () => {
        if (queue.length > 0) {
            const url = queue.shift()!;
            try {
                const song = await downloadSong(url);
                stream.setReadable(song.stream);
                cachedConnection.currentSong = song.info;
            } catch (error) {
                console.error(error);
                stream.emit('finish');
            }
        }
    });
};

export const addToQueue = async (
    chat: Chat.SupergroupChat,
    url: string,
): Promise<number | null> => {
    if (!cache.has(chat.id)) {
        await createConnection(chat);
        return addToQueue(chat, url);
    }

    const connection = cache.get(chat.id)!;
    const { stream, queue } = connection;

    if (stream.finished) {
        try {
            const song = await downloadSong(url);
            stream.setReadable(song.stream);
            connection.currentSong = song.info;

            cache.set(chat.id, connection);
        } catch (error) {
            console.error(error);
            return -1;
        }

        return 0;
    }

    return queue.push(url);
};

export const getCurrentSong = (
    chatId: number,
): DownloadedSong['info'] | null => {
    if (cache.has(chatId)) {
        const { currentSong } = cache.get(chatId)!;
        return currentSong;
    }

    return null;
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
