
export default {
  command: ['personality', 'persona'],
  tags: ['ai'],
  help: ['/personality [nama]'],
  description: 'Atur personality AI',
  async run(ctx) {
    const args = ctx.message.text.split(' ').slice(1);
    const personality = args[0];
    const userId = ctx.from.id.toString();

    const personalities = {
      default: '🤖 Default - Asisten yang membantu dan ramah',
      funny: '😂 Funny - AI yang lucu dan suka bercanda', 
      professional: '💼 Professional - AI formal dan profesional',
      creative: '🎨 Creative - AI kreatif dan imajinatif',
      technical: '⚙️ Technical - AI ahli teknologi dan programming'
    };

    if (!personality) {
      const current = global.ai.getConversation(userId).personality;
      let text = `🎭 *AI Personalities*\n\nCurrent: ${personalities[current]}\n\n`;
      
      for (const [key, desc] of Object.entries(personalities)) {
        text += `${key === current ? '✅' : '•'} /${key} - ${desc}\n`;
      }
      
      return ctx.reply(text, { parse_mode: 'Markdown' });
    }

    if (global.ai.setPersonality(userId, personality)) {
      ctx.reply(`✅ Personality diubah ke: ${personalities[personality]}`);
    } else {
      ctx.reply('❌ Personality tidak ditemukan!');
    }
  }
};
