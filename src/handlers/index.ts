import { Composer } from 'grammy';

import play from './play';
import queue from './queue';
import song from './song';
import pause from './pause';
import skip from './skip';

const composer = new Composer();

composer
    .filter(ctx => ctx.chat?.type == 'supergroup')
    .use(play)
    .use(queue)
    .use(song)
    .use(pause)
    .use(skip);

export default composer;
