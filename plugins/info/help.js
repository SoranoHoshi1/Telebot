
export default {
  command: ['help', 'bantuan'],
  tags: ['info', 'main'],
  help: ['/help', '/bantuan'],
  description: 'Panduan lengkap penggunaan bot',
  async run(ctx) {
    try {
      const helpText = `
🆘 *PANDUAN LENGKAP HOSHI BOT*

🏠 *MENU UTAMA*
• /menu - Lihat semua kategori
• /start - Mulai bot
• /help - Panduan ini

🤖 *ARTIFICIAL INTELLIGENCE*
• /ai <pertanyaan> - Chat dengan AI
• /hd <reply foto> - Upscale gambar

🛠 *TOOLS & UTILITIES*
• /weather <kota> - Cek cuaca
• /crypto <symbol> - Harga cryptocurrency
• /qr <text> - Generate QR code
• /calc <operasi> - Kalkulator
• /shorturl <url> - Pendekkan URL
• /translate <text> - Terjemahkan
• /password [length] - Generate password

🎮 *GAMES & FUN*
• /ttt - Main Tic Tac Toe
• /quote - Quote inspiratif
• /facts - Fakta menarik

⬇️ *DOWNLOADER*
• /ytmp3 <url> - Download audio YouTube
• /ytmp4 <url> - Download video YouTube

🎭 *STICKER & MEDIA*
• /brat <text> - Buat sticker brat
• /play <query> - Cari musik

ℹ️ *INFORMASI*
• /my - Info profil Anda
• /owner - Info owner bot
• /ping - Cek kecepatan bot

🔐 *OWNER ONLY*
• /exec <code> - Execute code
• /reload - Reload plugins
• /restart - Restart bot

💡 *TIPS PENGGUNAAN:*
• Gunakan /menu untuk navigasi mudah
• Semua command bisa digunakan tanpa prefix
• Bot support callback button
• Laporkan bug ke @SoranoHoshi

🚀 *NEW FEATURES:*
✅ Weather checker dengan data real-time
✅ Crypto price tracker (BTC, ETH, dll)
✅ QR code generator
✅ Advanced calculator
✅ URL shortener
✅ Multi-language translator
✅ Secure password generator
✅ Interactive games
✅ Random facts & quotes

📱 *SUPPORT:*
• GitHub: github.com/yourusername
• Telegram: @SoranoHoshi
• Report Bug: /help + mention issue

© 2024 Hoshi Bot - Powered by Replit
      `.trim();

      ctx.reply(helpText, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Help Error:', error);
      ctx.reply('⚠️ Gagal menampilkan bantuan. Coba lagi nanti.');
    }
  }
};
