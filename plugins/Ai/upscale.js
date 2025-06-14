import axios from 'axios';

export default {
  command: ['hd'],
  tags: ['ai'],
  help: ['/hd'],
  description: 'Tingkatkan kualitas gambar (AI Upscale)',
  onlyPrem: true,
  async run(ctx) {
    const photo = ctx.message.reply_to_message?.photo?.slice(-1)[0];
    if (!photo) return ctx.reply('❌ Balas gambar yang ingin di-HD-kan!');

    try {
      const file = await ctx.telegram.getFile(photo.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${ctx.telegram.token}/${file.file_path}`;

      const { data } = await axios.get(`https://api.ryzumi.vip/api/ai/upscaler?url=${encodeURIComponent(fileUrl)}`, {
        responseType: 'arraybuffer',
      });

      await ctx.replyWithPhoto({ source: Buffer.from(data) }, { caption: '✅ *Gambar berhasil di-HD-kan!*' });
    } catch (err) {
      console.error(err);
      ctx.reply('❌ Gagal memproses gambar:\n' + (err.message || err));
    }
  },
};
