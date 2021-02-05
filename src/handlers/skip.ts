import { Composer } from 'telegraf';
import { skip } from '../tgcalls';

export const skipHandler = Composer.command('skip', ctx => {
    const { chat } = ctx.message;

    if (chat.type !== 'supergroup') {
        return;
    }

    const skipped = skip(chat.id);
    ctx.reply(skipped ? 'Skipped.' : "There's no song playing.");
});
