
export default {
  command: ['qr', 'qrcode'],
  tags: ['tools', 'maker'],
  help: ['/qr <text>', '/qrcode <text>'],
  description: 'Generate QR Code dari text',
  async run(ctx) {
    try {
      const text = ctx.message.text.split(' ').slice(1).join(' ');
      if (!text) {
        return ctx.reply('📝 Masukkan text untuk di-generate!\n\nContoh: /qr https://google.com');
      }

      if (text.length > 500) {
        return ctx.reply('❌ Text terlalu panjang! Maksimal 500 karakter.');
      }

      await ctx.reply('📱 Generating QR Code...');

      const encodedText = encodeURIComponent(text);
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedText}`;

      await ctx.replyWithPhoto(
        { url: qrUrl },
        {
          caption: `📱 *QR Code Generated*\n\n📝 *Text:* ${text}\n\n🔗 Scan QR code untuk melihat hasilnya!`,
          parse_mode: 'Markdown'
        }
      );
    } catch (error) {
      console.error('QR Code Error:', error);
      ctx.reply('⚠️ Gagal generate QR Code. Coba lagi nanti.');
    }
  }
};
