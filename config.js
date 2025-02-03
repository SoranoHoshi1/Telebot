import { watchFile, unwatchFile } from 'fs';
import chalk from 'chalk';
import { fileURLToPath } from 'url';


global.config = {
    owner: [
        ['6283159699851', 'Sorano Hoshi']
    ],
    token: "Token Lu",
};

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
    unwatchFile(file);
    console.log(chalk.redBright("Update 'config.js'"));
    import(`${file}?update=${Date.now()}`);
});