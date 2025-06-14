import fetch from 'node-fetch';

export default {
  command: 'nsfw',
  tags: ['nsfw'],
  help: ['/nsfw <tag>'],
  description: 'Ambil gambar NSFW dari Yande.re',
  async run(ctx) {
    const query = ctx.message.text.split(' ').slice(1).join('+');
    if (!query) return ctx.reply('Masukkan tag gambar!\n\nContoh:\n/nsfw neko');

    const apiUrl = `https://yande.re/post.json?tags=${query}+rating:e&limit=10`;

    try {
      const res = await fetch(apiUrl);
      const json = await res.json();
      if (!json.length) return ctx.reply('Tidak ditemukan gambar dengan tag tersebut.');

      const random = json[Math.floor(Math.random() * json.length)];

      const imageInfo = `🖼️ Source: yande.re/post/show/${random.id}\n📷 Resolution: ${random.width}x${random.height}`;

      const oversized = random.width > 10000 || random.height > 10000;

      if (oversized || random.file_size > 19 * 1024 * 1024) {
        await ctx.replyWithDocument({ url: random.file_url, filename: `yandere_${random.id}.jpg` }, { caption: imageInfo });
      } else {
        await ctx.replyWithPhoto({ url: random.file_url }, { caption: imageInfo });
      }
    } catch (err) {
      console.error(err);
      ctx.reply('❗ Gagal mengambil data dari Yande.re');
    }
  },
};
