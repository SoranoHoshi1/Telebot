export default {
  command: "owner",
  description: "mengirim info tentang owner",
  async run(ctx) {
  const ownerNumber = global.config.owner[0][0];
  const ownerName = global.config.owner[0][1];
  const PhoneNumber = `+${ownerNumber}`;
  const Name = ownerName;

  ctx.replyWithContact(PhoneNumber, Name);
}
};