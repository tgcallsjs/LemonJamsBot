import { bot } from './bot';
import { initHandlers } from './handlers';

(async () => {
    initHandlers();

    await bot.launch();
    console.log(`@${bot.botInfo?.username} is running...`);
})();
