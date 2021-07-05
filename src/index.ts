import readline from 'readline';
import { client } from './client';
import { bot } from './bot';
import { initHandlers } from './handlers';

const read = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

(async () => {
    initHandlers();

    await client.start({
        phoneNumber: () => {
            return new Promise(r => read.question('Phone number: ', r));
        },
        phoneCode: async () => {
            return new Promise(r => read.question('Phone code: ', r));
        },
        password: async () => {
            return new Promise(r => read.question('Password: ', r));
        },
        onError: err => {
            console.log(`Error starting client: ${err.message}`);
        },
    });
    await bot.launch();
    console.log(`@${bot.botInfo?.username} is running...`);
})();
