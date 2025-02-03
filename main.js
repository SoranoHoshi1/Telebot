process.noDeprecation = true;
import { Telegraf } from 'telegraf';
import { loadPlugins } from './lib/plugins.js';
import './config.js';
import { logMessage } from './lib/getMessage.js';

await loadPlugins();

const bot = new Telegraf(global.config.token);

bot.on('text', async (ctx) => {
  logMessage(ctx);

  const messageText = ctx.message.text.trim();
  if (!messageText.startsWith('/')) return;

  const command = messageText.split(' ')[0].slice(1).toLowerCase();

  if (global.plugins.has(command)) {
    try {
      await global.plugins.get(command).run(ctx);
    } catch (error) {
      console.error(`❌ Error saat menjalankan command "${command}":`, error);
      ctx.reply(`⚠ Terjadi kesalahan saat menjalankan command "${command}".`);
    }
  }
});

bot.launch()
  .then(() => console.log('🚀 Bot Telegram jalan...'))
  .catch((err) => console.error('❌ Error:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));