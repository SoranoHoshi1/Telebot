export default {
  command: "owner",
  tags: ['info'],
  help: ['/owner'],
  description: "mengirim info tentang owner",
  async run(ctx) {
    const ownerInfo = config.owner[0];

    await ctx.reply(`👤 *Owner Bot*

📱 *Name:* ${ownerInfo[0]}
🆔 *ID:* ${ownerInfo[1]}
💬 *Contact:* @${ownerInfo[0]}

📞 Hubungi owner jika ada masalah atau pertanyaan tentang bot ini.`, { parse_mode: 'Markdown' });
  }
};