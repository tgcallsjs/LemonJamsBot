import { Composer } from 'grammy';
import { skip } from '../tgcalls';

const composer = new Composer();

composer.command('skip', ctx => {
    const skipped = skip(ctx.chat.id);
    ctx.reply(skipped ? 'Skipped.' : "There's no song playing.");
});

export default composer;
