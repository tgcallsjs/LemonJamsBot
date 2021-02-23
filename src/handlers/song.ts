import { Composer } from 'telegraf';
import { getCurrentSong } from '../tgcalls';
import escapeHtml from '@youtwitface/escape-html';

export const songHandler = Composer.command('song', ctx => {
    const { chat } = ctx.message;

    if (chat.type !== 'supergroup') {
        return;
    }

    const song = getCurrentSong(chat.id);

    if (song === null) {
        ctx.reply('There is no song playing.');
        return;
    }

    let time = '';

    if (song.duration > 0) {
        time += ' - ';

        const hours = Math.floor(song.duration / 3600);
        const minutes = Math.floor(song.duration / 60) % 60;
        const seconds = (song.duration % 60).toString().padStart(2, '0');

        if (hours > 0) {
            time += `${hours}:${minutes.toString().padStart(2, '0')}:${seconds}`;
        } else {
            time += `${minutes}:${seconds}`;
        }
    }

    const message = `<a href="https://youtu.be/${song.id}">${escapeHtml(song.title)}</a>${time}`;

    ctx.reply(message, {
        parse_mode: 'HTML',
    });
});
