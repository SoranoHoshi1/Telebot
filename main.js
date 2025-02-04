process.noDeprecation = true;
import { Telegraf } from 'telegraf';
import { loadPlugins } from './lib/plugins.js';
import './config.js';
import { logMessage } from './lib/getMessage.js';

if (!global.config?.token) {
  console.error('❌ Token bot tidak ditemukan di konfigurasi!');
  process.exit(1);
}

await loadPlugins();

const bot = new Telegraf(global.config.token);

function hasPermission(plugin, userId) {
  const isOwner = global.owner.some(([num]) => num === userId);
  const isDev = global.dev.some(([num]) => num === userId);

  if (plugin.owner && !isOwner && !isDev) {
    return { allowed: false, message: "⚠ Command ini hanya bisa digunakan oleh Owner atau Developer." };
  }
  if (plugin.dev && !isDev) {
    return { allowed: false, message: "⚠ Command ini hanya bisa digunakan oleh Developer." };
  }
  return { allowed: true };
}

bot.on('text', async (ctx) => {
  logMessage(ctx);

  const messageText = ctx.message.text.trim();
  if (!messageText.startsWith('/')) return;

  const command = messageText.split(' ')[0].slice(1).toLowerCase();
  const userId = ctx.from.id.toString();
  
  console.log(`📩 Command diterima: /${command} dari User ID: ${userId}`);

  if (global.plugins.has(command)) {
    const plugin = global.plugins.get(command);
    const { allowed, message } = hasPermission(plugin, userId);
    if (!allowed) return ctx.reply(message);

    try {
      await plugin.run(ctx);
      console.log(`✅ Command "/${command}" berhasil dijalankan oleh ${userId}`);
    } catch (error) {
      console.error(`❌ Error saat menjalankan command "${command}":`, error);
      ctx.reply(`⚠ Terjadi kesalahan saat menjalankan command "${command}".`);
    }
  } else {
    console.log(`⚠ Command "/${command}" tidak ditemukan.`);
    ctx.reply(`⚠ Command "/${command}" tidak ditemukan.`);
  }
});

bot.launch()
  .then(() => console.log('🚀 Bot Telegram jalan dan siap menerima perintah!'))
  .catch((err) => console.error('❌ Error saat menjalankan bot:', err));

process.once('SIGINT', () => {
  console.log('⚠ Bot dihentikan dengan SIGINT');
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  console.log('⚠ Bot dihentikan dengan SIGTERM');
  bot.stop('SIGTERM');
});