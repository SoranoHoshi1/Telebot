export default {
  command: "halo",
  tags: ['main'],
  help: ['/halo'],
  description: "Menyapa pengguna dengan ramah",
  async run(ctx) {
    ctx.reply('Halo juga!');
  }
};