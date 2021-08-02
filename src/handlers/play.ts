import { Composer } from 'grammy';
import { addToQueue } from '../tgcalls';

const composer = new Composer();

composer.command('play', async ctx => {
    if (ctx.chat.type !== 'supergroup') {
        return;
    }

    const [commandEntity] = ctx.message?.entities!;
    const text =
        ctx.message?.text?.slice(commandEntity.length + 1) ||
        ctx.message?.reply_to_message?.text;

    if (!text) {
        await ctx.reply('You need to specify a YouTube URL.');
        return;
    }

    const index = await addToQueue(ctx.chat, text);

    let message;

    switch (index) {
        case -1:
            message = 'Failed to download song.';
            break;

        case 0:
            message = 'Playing.';
            break;

        default:
            message = `Queued at position ${index}.`;
    }

    await ctx.reply(message);
});

export default composer;
