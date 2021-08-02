import { Composer } from 'grammy';
import { getQueue } from '../tgcalls';

const composer = new Composer();

composer.command('queue', ctx => {
    const queue = getQueue(ctx.chat.id);
    const message =
        queue && queue.length > 0
            ? queue.map((url, index) => `${index + 1}. ${url}`).join('\n')
            : 'The queue is empty.';

    ctx.reply(message);
});

export default composer;
