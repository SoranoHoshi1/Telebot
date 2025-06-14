export default {
  command: "my",
  tags: ['info'],
  help: ['/my'],
  description: "info user",
  async run(ctx) {
    const user = ctx.from;
    const fullName = `${user.first_name} ${user.last_name || ''}`.trim();
    const userId = user.id;
    const username = user.username ? `@${user.username}` : 'Tidak ada username';
    const response = `🧑‍💼 Nama Lengkap: ${fullName}\n🆔 ID: ${userId}\n💬 Username: ${username}`;
    ctx.reply(response);
  }
};