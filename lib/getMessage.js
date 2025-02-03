import chalk from 'chalk';

export function logMessage(ctx) {
  const { message } = ctx;
  if (!message || !message.from || !message.chat) return;

  const sender = `${chalk.green(message.from.first_name || 'Unknown')} ${chalk.gray(`(@${message.from.username || 'NoUsername'})`)}`;
  const receiver = message.chat.type === 'private' 
    ? chalk.blue('Private Chat') 
    : chalk.yellow(`Group: ${message.chat.title || 'Unknown'}`);

  console.log(`${chalk.magenta('[📩 MESSAGE]')} Dari: ${sender} → Ke: ${receiver}`);
  console.log(`${chalk.cyan('Pesan:')} ${message.text}`);
}