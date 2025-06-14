
import axios from 'axios';

export default {
  command: ['weather', 'cuaca'],
  tags: ['tools', 'internet'],
  help: ['/weather <kota>', '/cuaca <kota>'],
  description: 'Cek informasi cuaca untuk kota tertentu',
  async run(ctx) {
    try {
      const text = ctx.message.text.split(' ').slice(1).join(' ');
      if (!text) {
        return ctx.reply('📍 Masukkan nama kota!\n\nContoh: /weather Jakarta');
      }

      await ctx.reply('🌤️ Mengecek cuaca...');

      const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
        params: {
          q: text,
          appid: 'b8b1c8c8c8c8c8c8c8c8c8c8c8c8c8c8', // Free API key (replace with real one)
          units: 'metric',
          lang: 'id'
        }
      });

      const weather = response.data;
      const result = `
🌍 *Cuaca ${weather.name}, ${weather.sys.country}*

🌡️ *Suhu:* ${weather.main.temp}°C (terasa ${weather.main.feels_like}°C)
📊 *Kondisi:* ${weather.weather[0].description}
💧 *Kelembaban:* ${weather.main.humidity}%
💨 *Angin:* ${weather.wind.speed} m/s
👁️ *Jarak Pandang:* ${weather.visibility / 1000} km
🌅 *Sunrise:* ${new Date(weather.sys.sunrise * 1000).toLocaleTimeString('id-ID')}
🌇 *Sunset:* ${new Date(weather.sys.sunset * 1000).toLocaleTimeString('id-ID')}
      `.trim();

      ctx.reply(result, { parse_mode: 'Markdown' });
    } catch (error) {
      if (error.response?.status === 404) {
        ctx.reply('❌ Kota tidak ditemukan! Pastikan nama kota benar.');
      } else {
        console.error('Weather API Error:', error);
        ctx.reply('⚠️ Gagal mendapatkan data cuaca. Coba lagi nanti.');
      }
    }
  }
};
