
import axios from 'axios';

export default {
  command: ['shorturl', 'short', 'tinyurl'],
  tags: ['tools', 'internet'],
  help: ['/shorturl <url>', '/short <url>', '/tinyurl <url>'],
  description: 'Pendekkan URL panjang menjadi URL pendek',
  async run(ctx) {
    try {
      const url = ctx.message.text.split(' ').slice(1).join(' ');
      if (!url) {
        return ctx.reply(`
🔗 *URL Shortener*

Gunakan format:
• /shorturl https://google.com
• /short https://youtube.com/watch?v=example

📝 Masukkan URL yang valid untuk dipendekkan!
        `.trim(), { parse_mode: 'Markdown' });
      }

      // Validate URL format
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      let fullUrl = url;
      
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        fullUrl = 'https://' + url;
      }

      if (!urlPattern.test(fullUrl)) {
        return ctx.reply('❌ Format URL tidak valid! Gunakan format: https://example.com');
      }

      await ctx.reply('🔗 Memendekkan URL...');

      try {
        // Using TinyURL API
        const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(fullUrl)}`);
        const shortUrl = response.data;

        if (shortUrl.includes('Error')) {
          throw new Error('TinyURL API Error');
        }

        const result = `
🔗 *URL Berhasil Dipendekkan!*

📎 *URL Asli:*
${fullUrl}

✂️ *URL Pendek:*
${shortUrl}

📊 *Penghematan:* ${fullUrl.length - shortUrl.length} karakter
🕐 *Dibuat:* ${new Date().toLocaleString('id-ID')}

💡 _Klik URL pendek untuk mengakses link asli!_
        `.trim();

        ctx.reply(result, { parse_mode: 'Markdown' });
      } catch (apiError) {
        // Fallback to is.gd
        const fallbackResponse = await axios.post('https://is.gd/create.php', 
          `format=simple&url=${encodeURIComponent(fullUrl)}`,
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const result = `
🔗 *URL Berhasil Dipendekkan!*

📎 *URL Asli:*
${fullUrl}

✂️ *URL Pendek:*
${fallbackResponse.data}

📊 *Penghematan:* ${fullUrl.length - fallbackResponse.data.length} karakter
        `.trim();

        ctx.reply(result, { parse_mode: 'Markdown' });
      }
    } catch (error) {
      console.error('URL Shortener Error:', error);
      ctx.reply('⚠️ Gagal memendekkan URL. Pastikan URL valid dan coba lagi nanti.');
    }
  }
};
