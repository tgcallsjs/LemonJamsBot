import { Api } from 'telegram';
import { client } from './client';
import { bot } from './bot';
import handlers from './handlers';

(async () => {
    bot.use(handlers);

    await client.start({ botAuthToken: '' });
    const me = (await client.getMe()) as Api.User;
    console.log('Logged in as', me?.firstName);

    const botUsername = (await bot.api.getMe()).username;
    console.log(`@${botUsername} is running...`);
    await bot.start();
})();
