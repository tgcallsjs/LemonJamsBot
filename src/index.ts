import { Api } from 'telegram';
import { client } from './client';
import { bot } from './bot';
import { initHandlers } from './handlers';

(async () => {
    initHandlers();

    await client.start({ botAuthToken: '' });
    const me = await client.getMe() as Api.User;
    console.log('Logged in as ', me?.firstName);

    await bot.launch();
    console.log(`@${bot.botInfo?.username} is running...`);
})();
