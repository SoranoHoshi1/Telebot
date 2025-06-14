export default {
  command: "start",
  tags: ['main'],
  help: ['/start'],
  description: "memulai bot",
  async run(ctx) {
    await ctx.reply("Bot Telah Di Mulai");
  }
};