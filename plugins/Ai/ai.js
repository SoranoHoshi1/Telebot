import axios from 'axios';

export default {
  command: "ai",
  description: "Berbicara dengan ai",
  async run(ctx) {
    const api = `https://api.ryzendesu.vip/api/ai/chatgpt?text=${ctx.message.text}`;
  try {
    const result = await axios.get(api);
    if (result.data.success) {
      ctx.reply(result.data.response);
    } else {
      ctx.reply('Maaf, terjadi kesalahan di server.');
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    ctx.reply('Maaf, terjadi kesalahan saat mengakses API.');
  }
  }
};