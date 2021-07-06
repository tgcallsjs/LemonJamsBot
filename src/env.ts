import { cleanEnv, str, num } from 'envalid';
import dotenv from 'dotenv';

dotenv.config();

export default cleanEnv(process.env, {
    BOT_TOKEN: str(),
    STRING_SESSION: str(),
    API_ID: num(),
    API_HASH: str(),
});
