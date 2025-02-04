export default {
  command: 'halo',
  description: "Balas dengan 'Halo juga!' setelah 2 detik",
  async run(ctx) {
    ctx.reply('Halo juga!');
  }
};