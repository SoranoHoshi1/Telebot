import { watchFile, unwatchFile } from 'fs';
import chalk from 'chalk';
import { fileURLToPath } from 'url';


global.config = {
    owner: [
        ['7088128349', 'Sorano Hoshi', true]
    ],
    token: "7565458161:AAGiXdYElgpBoMdDgfYvtRD4fCa3dvyNlnw",
};

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
    unwatchFile(file);
    console.log(chalk.redBright("Update 'config.js'"));
    import(`${file}?update=${Date.now()}`);
});
global.owner = global.config.owner.filter(([_, __, isDev]) => !isDev);
global.dev = global.config.owner.filter(([_, __, isDev]) => isDev);