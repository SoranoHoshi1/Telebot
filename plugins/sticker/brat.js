import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export default {
  command: 'brat',
  tags: ['sticker', 'maker'],
  help: ['/brat <text>', '/brat <text> --gif'],
  description: 'Membuat stiker brat dari teks (tambahkan --gif untuk animasi)',
  async run(ctx) {
    const text = ctx.message.reply_to_message?.text || ctx.message.text.split(' ').slice(1).join(' ');

    if (!text) {
      return ctx.reply(`❗ *Format Salah* ❗\n\nGunakan perintah ini dengan format:\n• /brat <teks>\n• Atau balas pesan dengan /brat saja.\n\n_Contoh:_\n/brat Aku suka Hoshino\nTambahkan *--gif* untuk animasi.`);
    }

    const isAnimated = text.includes('--gif');
    const cleanText = text.replace('--gif', '').trim();

    try {
      await ctx.reply('⏳ Membuat stiker...');

      if (isAnimated) {
        const tempDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
        const framePaths = [];
        const words = cleanText.split(' ');

        for (let i = 0; i < words.length; i++) {
          const currentText = words.slice(0, i + 1).join(' ');
          const res = await axios.get(`https://aqul-brat.hf.space/?text=${encodeURIComponent(currentText)}`, {
            responseType: 'arraybuffer',
          });

          const framePath = path.join(tempDir, `frame${i}.mp4`);
          fs.writeFileSync(framePath, res.data);
          framePaths.push(framePath);
        }

        const fileListPath = path.join(tempDir, 'filelist.txt');
        const fileListContent = framePaths.map((p) => `file '${p}'\nduration 1`).join('\n') + `\nfile '${framePaths[framePaths.length - 1]}'\nduration 3\n`;

        fs.writeFileSync(fileListPath, fileListContent);

        const outputVideo = path.join(tempDir, 'output.mp4');
        const outputSticker = path.join(tempDir, 'output.webp');

        execSync(`ffmpeg -y -f concat -safe 0 -i ${fileListPath} -vf "fps=30" -c:v libx264 -preset veryfast -pix_fmt yuv420p -t 10 ${outputVideo}`);
        execSync(`ffmpeg -i ${outputVideo} -vf "scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease" -c:v libwebp -lossless 1 -qscale 90 -preset default -loop 0 -an -vsync 0 -s 512x512 ${outputSticker}`);

        const buffer = fs.readFileSync(outputSticker);
        await ctx.replyWithSticker({ source: buffer });

        framePaths.forEach((f) => fs.unlinkSync(f));
        fs.unlinkSync(fileListPath);
        fs.unlinkSync(outputVideo);
        fs.unlinkSync(outputSticker);
      } else {
        const res = await axios.get(`https://aqul-brat.hf.space/?text=${encodeURIComponent(cleanText)}`, {
          responseType: 'arraybuffer',
        });

        await ctx.replyWithSticker({ source: res.data });
      }
    } catch (err) {
      console.error(err);
      ctx.reply('⚠️ Terjadi kesalahan saat membuat stiker. Coba lagi nanti.\n\n' + err.message);
    }
  },
};
