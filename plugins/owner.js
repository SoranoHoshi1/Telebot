export default async (ctx) => {
  const ownerPhoneNumber = '+6283159699851';
  const ownerName = 'Hoshi';

  ctx.replyWithContact(ownerPhoneNumber, ownerName);
};