import { Composer } from 'telegraf';
import { addToQueue } from '../tgcalls';

export const playHandler = Composer.command('play', async ctx => {
    const { chat } = ctx.message;

    if (chat.type !== 'supergroup') {
        await ctx.reply('I can only play in groups.');
        return;
    }

    const [commandEntity] = ctx.message.entities!;
    const text = ctx.message.text.slice(commandEntity.length + 1);

    if (!text) {
        await ctx.reply('You need to specify a YouTube URL.');
        return;
    }

    const index = await addToQueue(chat, text);

    await ctx.reply(index === 0 ? 'Playing.' : `Queued at position ${index}.`);
});
