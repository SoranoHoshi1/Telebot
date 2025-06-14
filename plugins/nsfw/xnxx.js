import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const baseurl = 'https://www.xnxx.com';

export default {
  command: 'xnxx',
  tags: ['nsfw'],
  help: ['/xnxx <query>'],
  description: 'Cari video dari xnxx.com (18+)',
  async run(ctx) {
    const query = ctx.message.text.split(' ').slice(1).join(' ');
    if (!query) return ctx.reply('Masukkan kata kunci pencarian!\n\nContoh:\n/xnxx japanese');

    try {
      let res = await xnxx.search(query);
      let randomNumber = Math.floor(Math.random() * 20) + 1;
      let { title, info, link } = res.result[randomNumber];
      let res2 = await xnxx.detail(link);
      let { image, files, duration } = res2.result;

      let caption = `title: ${title}\nduration: ${duration}`;

      await ctx.replyWithVideo({ url: files.high }, { caption: caption, parse_mode: 'Markdown' });
    } catch (e) {
      console.error(e);
      ctx.reply(e);
    }
  },
};

const xnxx = {
  search: async (query) => {
    return new Promise((resolve, reject) => {
      const baseurl = 'https://www.xnxx.com';
      fetch(`${baseurl}/search/${query}/${Math.floor(Math.random() * 3) + 1}`, { method: 'get' })
        .then((res) => res.text())
        .then((res) => {
          let $ = cheerio.load(res, { xmlMode: false });
          let title = [];
          let url = [];
          let desc = [];
          let results = [];

          $('div.mozaique').each(function (a, b) {
            $(b)
              .find('div.thumb')
              .each(function (c, d) {
                url.push(baseurl + $(d).find('a').attr('href').replace('/THUMBNUM/', '/'));
              });
          });
          $('div.mozaique').each(function (a, b) {
            $(b)
              .find('div.thumb-under')
              .each(function (c, d) {
                desc.push($(d).find('p.metadata').text());
                $(d)
                  .find('a')
                  .each(function (e, f) {
                    title.push($(f).attr('title'));
                  });
              });
          });
          for (let i = 0; i < title.length; i++) {
            results.push({
              title: title[i],
              info: desc[i],
              link: url[i],
            });
          }
          resolve({
            code: 200,
            status: true,
            result: results,
          });
        })
        .catch((err) =>
          reject({
            code: 503,
            status: false,
            result: err,
          })
        );
    });
  },

  detail: async (URL) => {
    return new Promise((resolve, reject) => {
      fetch(`${URL}`, { method: 'get' })
        .then((res) => res.text())
        .then((res) => {
          let $ = cheerio.load(res, { xmlMode: false });
          const title = $('meta[property="og:title"]').attr('content');
          const duration = $('meta[property="og:duration"]').attr('content');
          const image = $('meta[property="og:image"]').attr('content');
          const info = $('span.metadata').text();
          const videoScript = $('#video-player-bg > script:nth-child(6)').html();
          const files = {
            low: (videoScript.match("html5player.setVideoUrlLow\\('(.*?)'\\);") || [])[1],
            high: videoScript.match("html5player.setVideoUrlHigh\\('(.*?)'\\);" || [])[1],
            HLS: videoScript.match("html5player.setVideoHLS\\('(.*?)'\\);" || [])[1],
            thumb: videoScript.match("html5player.setThumbUrl\\('(.*?)'\\);" || [])[1],
            thumb69: videoScript.match("html5player.setThumbUrl169\\('(.*?)'\\);" || [])[1],
            thumbSlide: videoScript.match("html5player.setThumbSlide\\('(.*?)'\\);" || [])[1],
            thumbSlideBig: videoScript.match("html5player.setThumbSlideBig\\('(.*?)'\\);" || [])[1],
          };
          resolve({
            status: 200,
            result: {
              title,
              URL,
              duration,
              image,
              info,
              files,
            },
          });
        })
        .catch((err) =>
          reject({
            code: 503,
            status: false,
            result: err,
          })
        );
    });
  },
};
