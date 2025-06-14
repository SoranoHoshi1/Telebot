import fs from 'fs';
import axios from 'axios';
import { ytSearch } from '../../lib/scrape.js';

export default {
  command: 'play',
  tags: ['sound', 'downloader'],
  help: ['/play <query>'],
  description: 'Cari dan kirim audio dari YouTube',
  async run(ctx) {
    const query = ctx.message.text.replace(/^\/\S+/, '').trim();
    if (!query) return ctx.reply('Masukkan query!\n\nContoh:\n/play lathi');

    try {
      const results = await ytSearch(query);
      if (!results.length) return ctx.reply(`Tidak ditemukan hasil untuk "${query}"`);

      const { title, uploaded, duration, views, url, thumbnail } = results[0];

      const caption = `
*––––––『 P L A Y 』––––––*

🎧 *Title:* ${title.trim()}
📤 *Published:* ${uploaded}
⏰ *Duration:* ${duration}
👁️ *Views:* ${views}

🎵 *Mengirim audio...*
      `.trim();

      await ctx.replyWithPhoto({ url: thumbnail }, {
        caption,
        parse_mode: 'Markdown'
      });

      // Note: Actual audio download would require ytdl implementation
      // This is a placeholder response
      await ctx.reply('🎵 Audio sedang diproses...\n\n*Note:* Fitur download audio memerlukan implementasi ytdl yang lebih lengkap.');

    } catch (error) {
      console.error('Error in play command:', error);
      await ctx.reply('⚠️ Terjadi kesalahan saat mencari audio.');
    }
  }
};