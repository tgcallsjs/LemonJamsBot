import { Composer } from 'telegraf';
import { pause } from '../tgcalls';

export const pauseHandler = Composer.command(['pause', 'resume'], async ctx => {
    const { chat } = ctx.message;

    if (chat.type !== 'supergroup') {
        return;
    }

    const paused = await pause(chat.id);
    const message = paused === null ? "There's nothing playing here." : paused ? 'Paused.' : 'Resumed.';

    await ctx.reply(message);
});
