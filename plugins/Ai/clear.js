
export default {
  command: ['clear_chat', 'reset_ai', 'new_chat'],
  tags: ['ai'],
  help: ['/clear_chat'],
  description: 'Reset percakapan dengan AI',
  async run(ctx) {
    const userId = ctx.from.id.toString();
    global.ai.clearConversation(userId);
    ctx.reply('🗑️ Percakapan AI telah di-reset. Mulai fresh conversation!');
  }
};
