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
  command: 'ytmp3',
  tags: ['downloader', 'sound'],
  help: ['/ytmp3 <url>'],
  description: 'Download audio dari YouTube',
  async run(ctx) {
    let text = ctx.message.text.replace(/^\/\S+/, '').trim();
    if (!text) return ctx.reply('Masukkan URL YouTube.\n\nContoh:\n/ytmp3 https://youtu.be/abc123xyz');
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

      const command = `./utils/yt-dlp -x --audio-format mp3 -o "${outputTemplate}" --no-playlist "${text}"`;
      await execPromise(command);

      const fileName = fs.readdirSync('./tmp').find((f) => f.startsWith(`${sanitizedTitle}_${timestamp}`));
      if (!fileName) throw new Error('Gagal mengunduh audio.');

      const filePath = `./tmp/${fileName}`;
      if (isDocument) {
        await ctx.replyWithDocument({ source: filePath, filename: fileName });
      } else {
        await ctx.replyWithAudio({ source: filePath }, { caption: rawTitle.trim() });
      }

      fs.unlinkSync(filePath);
    } catch (e) {
      try {
        const response = await axios.post(
          'https://www.clipto.com/api/youtube',
          { url: text },
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
              Accept: 'application/json, text/plain, */*',
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
              Cookie:
                'NEXT_LOCALE=en; uu=0732700dd1f3454e8a81ee69ed5dbddc; bucket=92; stripe-checkout=default; country=ID; ip=140.213.255.151; mac-download=mac; show-mac-download-new-interface=default_second; _ga=GA1.1.129619311.1749828738; _gcl_au=1.1.1940353527.1749828739; _uetsid=97e79e50486b11f0b33d5dd16d0e542f; _uetvid=97e87260486b11f0afca616e27ac400b; _clck=zwwjyg%7C2%7Cfwq%7C0%7C1990; _clsk=10nfz77%7C1749828742046%7C1%7C1%7Ce.clarity.ms%2Fcollect; _ga_ZVDHSR45N6=GS2.1.s1749828738$o1$g0$t1749828744$j54$l0$h0; XSRF-TOKEN=5klkHJGC-QtQLZX2avxWtymfBeDKFRB6Ondw',
            },
          }
        );

        if (!response.data.success || !response.data.medias) throw new Error('Tidak ada hasil dari API Clipto');

        const audio = response.data.medias.find((m) => m.type === 'audio' || m.ext === 'mp3');
        if (!audio) throw new Error('Audio tidak ditemukan di response.');

        const mediaUrl = audio.url;
        const title = response.data.title || 'Audio YouTube';
        const filename = `${title.replace(/[^\w\s()-]/g, '').replace(/\s+/g, '_')}.mp3`;

        const download = await axios.get(mediaUrl, { responseType: 'stream' });
        const path = `./tmp/${filename}`;

        if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp');
        const writer = fs.createWriteStream(path);
        download.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        if (isDocument) {
          await ctx.replyWithDocument({ source: path, filename });
        } else {
          await ctx.replyWithAudio({ source: path }, { caption: title });
        }

        fs.unlinkSync(path);
      } catch (err) {
        ctx.reply('❌ Gagal mengunduh audio dari YouTube.');
        console.error(err);
      }
    }
  },
};