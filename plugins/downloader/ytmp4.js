import fs from 'fs';
import axios from 'axios';
import { exec } from 'child_process';

const execPromise = (cmd) =>
  new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err || stderr) return reject(stderr || err.message || 'Unknown error');
      resolve(stdout);
    });
  });

const extractVideoId = (url) => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/);
  return match ? match[1] : null;
};

export default {
  command: 'ytmp4',
  tags: ['downloader'],
  help: ['ytmp4 <url> doc(optional)'],
  description: 'Download video dari YouTube (MP4)',
  async run(ctx) {
    let text = ctx.message.text.replace(/^\/\S+/, '').trim();
    if (!text) return ctx.reply('Masukkan URL YouTube.\n\nContoh:\n/ytmp4 https://youtu.be/abc123xyz');
    if (!extractVideoId(text)) return ctx.reply('❌ URL tidak valid.');

    const isDocument = text.endsWith(' doc');
    if (isDocument) text = text.replace(/ doc$/, '');

    try {
      const rawTitle = await execPromise(`./utils/yt-dlp --get-title "${text}"`);
      const sanitizedTitle = rawTitle
        .trim()
        .replace(/[^\w\s()-]/g, '')
        .replace(/\s+/g, '_');

      if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp');
      const timestamp = Date.now();
      const outputTemplate = `./tmp/${sanitizedTitle}_${timestamp}.%(ext)s`;

      const command = `./utils/yt-dlp -f mp4 -o "${outputTemplate}" --no-playlist "${text}"`;
      await execPromise(command);

      const fileName = fs.readdirSync('./tmp').find((f) => f.startsWith(`${sanitizedTitle}_${timestamp}`));
      if (!fileName) throw new Error('Gagal mengunduh video.');

      const filePath = `./tmp/${fileName}`;

      if (isDocument) {
        await ctx.replyWithDocument({ source: filePath, filename: fileName });
      } else {
        await ctx.replyWithVideo({ source: filePath }, { caption: rawTitle.trim() });
      }

      fs.unlinkSync(filePath);
    } catch {
      try {
        const config = {
          method: 'POST',
          url: 'https://www.clipto.com/api/youtube',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'sec-ch-ua': '"Chromium";v="137", "Not/A)Brand";v="24"',
            'sec-ch-ua-mobile': '?1',
            'sec-ch-ua-platform': '"Android"',
            origin: 'https://www.clipto.com',
            'sec-fetch-site': 'same-origin',
            'sec-fetch-mode': 'cors',
            'sec-fetch-dest': 'empty',
            referer: 'https://www.clipto.com/media-downloader/youtube-downloader',
            'accept-language': 'en-US,en;q=0.9,id-ID;q=0.8,id;q=0.7',
          },
          data: JSON.stringify({ url: text }),
        };

        const response = await axios.request(config);
        if (!response.data || !response.data.success || !response.data.medias) {
          return ctx.reply('❌ Gagal mengambil video dari API kedua.');
        }

        const mp4 = response.data.medias.find((m) => m.ext === 'mp4');
        if (!mp4 || !mp4.url) {
          return ctx.reply('❌ Format video MP4 tidak ditemukan.');
        }

        await ctx.replyWithVideo({ url: mp4.url }, { caption: response.data.title || 'Video' });
      } catch (e) {
        ctx.reply('❌ Gagal mengunduh video dari YouTube.');
        console.log(e);
      }
    }
  },
};