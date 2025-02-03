export default {
  command: "hallo",
  description: "Balas dengan 'Halo juga!' setelah 2 detik",
  async run(ctx) {
    await ctx.reply("Halo juga!");
  }
};