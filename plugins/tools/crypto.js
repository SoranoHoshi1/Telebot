
import axios from 'axios';

export default {
  command: ['crypto', 'btc', 'eth', 'price'],
  tags: ['tools', 'internet'],
  help: ['/crypto <symbol>', '/btc', '/eth', '/price <symbol>'],
  description: 'Cek harga cryptocurrency terkini',
  async run(ctx) {
    try {
      const args = ctx.message.text.split(' ').slice(1);
      let symbol = args[0]?.toLowerCase();
      
      // Default symbols for quick access
      if (ctx.message.text.startsWith('/btc')) symbol = 'bitcoin';
      if (ctx.message.text.startsWith('/eth')) symbol = 'ethereum';
      
      if (!symbol) {
        return ctx.reply(`
💰 *Crypto Price Checker*

Gunakan format:
• /crypto bitcoin
• /crypto ethereum
• /btc (Bitcoin)
• /eth (Ethereum)

📈 *Crypto populer:*
bitcoin, ethereum, cardano, polkadot, 
chainlink, litecoin, stellar, dogecoin
        `.trim(), { parse_mode: 'Markdown' });
      }

      await ctx.reply('💰 Mengecek harga crypto...');

      const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
        params: {
          ids: symbol,
          vs_currencies: 'usd,idr',
          include_24hr_change: true,
          include_market_cap: true
        }
      });

      const data = response.data[symbol];
      if (!data) {
        return ctx.reply('❌ Cryptocurrency tidak ditemukan! Periksa symbol yang dimasukkan.');
      }

      const change24h = data.usd_24h_change;
      const changeEmoji = change24h >= 0 ? '📈' : '📉';
      const changeColor = change24h >= 0 ? '🟢' : '🔴';

      const result = `
💰 *${symbol.toUpperCase()} Price*

💵 *USD:* $${data.usd.toLocaleString()}
💸 *IDR:* Rp ${data.idr.toLocaleString()}

${changeEmoji} *24h Change:* ${changeColor} ${change24h?.toFixed(2)}%

📊 *Market Cap (USD):* $${data.usd_market_cap?.toLocaleString() || 'N/A'}

🕐 *Last Updated:* ${new Date().toLocaleString('id-ID')}
      `.trim();

      ctx.reply(result, { parse_mode: 'Markdown' });
    } catch (error) {
      if (error.response?.status === 404) {
        ctx.reply('❌ Cryptocurrency tidak ditemukan! Pastikan symbol benar.');
      } else {
        console.error('Crypto API Error:', error);
        ctx.reply('⚠️ Gagal mendapatkan data crypto. Coba lagi nanti.');
      }
    }
  }
};
