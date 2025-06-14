
export default {
  command: ['ai', 'chat', 'ask'],
  tags: ['ai'],
  help: ['/ai <pertanyaan>', '/chat <pesan>', '/ask <pertanyaan>'],
  description: 'Berbicara dengan AI yang canggih dengan context memory',
  async run(ctx) {
    const args = ctx.message.text.split(' ').slice(1);
    const message = args.join(' ');

    if (!message) {
      return ctx.reply(`
🤖 *AI Assistant*

Gunakan format:
• /ai <pertanyaan>
• /chat <pesan>  
• /ask <pertanyaan>

📝 *Fitur:*
• Context memory (mengingat percakapan)
• Multiple personalities
• Content moderation
• Multi-language support

🎭 *Personalities:* /personality
🗑️ *Reset chat:* /clear_chat
      `.trim(), { parse_mode: 'Markdown' });
    }

    try {
      await ctx.reply('🤖 Sedang berpikir...');
      
      const userId = ctx.from.id.toString();
      const moderation = await global.ai.moderateContent(message);
      
      if (moderation.flagged) {
        return ctx.reply('⚠️ Maaf, pesan Anda mengandung konten yang tidak pantas.');
      }

      const response = await global.ai.generateResponse(userId, message);
      
      if (response.length > 4000) {
        const chunks = response.match(/.{1,4000}/g);
        for (let i = 0; i < chunks.length; i++) {
          await ctx.reply(chunks[i]);
          if (i < chunks.length - 1) {
            await global.Utils.sleep(1000);
          }
        }
      } else {
        await ctx.reply(response);
      }

      const user = global.db.getUser(userId);
      user.totalCommands = (user.totalCommands || 0) + 1;
      
    } catch (error) {
      global.log.error('AI command error:', error);
      await ctx.reply('⚠️ Maaf, terjadi kesalahan saat memproses permintaan AI.');
    }
  }
};
