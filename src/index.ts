import { client } from './client';
import { bot } from './bot';
import { initHandlers } from './handlers';

(async () => {
    initHandlers();

    await client.start({ botAuthToken: '' });
    console.log(client.session.save());
    await bot.launch();
    console.log(`@${bot.botInfo?.username} is running...`);
})();
