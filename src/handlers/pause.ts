import { Composer } from 'grammy';
import { pause } from '../tgcalls';

const composer = new Composer();

composer.command(['pause', 'resume'], ctx => {
    const paused = pause(ctx.chat.id);
    const message =
        paused === null
            ? "There's nothing playing here."
            : paused
            ? 'Paused.'
            : 'Resumed.';

    return ctx.reply(message);
});

export default composer;
