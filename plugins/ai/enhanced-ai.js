
export default {
  command: ['ai', 'ask', 'chat', 'gpt'],
  tags: ['ai'],
  help: ['/ai <question>', '/ask <question>', '/chat <question>', '/gpt <question>'],
  description: 'Enhanced AI chat with multiple providers',
  async run(ctx) {
    try {
      const text = ctx.message.text.split(' ').slice(1).join(' ');
      
      if (!text) {
        return ctx.reply(`
🤖 *Enhanced AI Assistant*

Ask me anything! I can help with:
• General questions and conversations
• Code explanations and debugging
• Creative writing and brainstorming
• Problem solving and analysis
• Educational topics

*Usage:*
/ai What is machine learning?
/ask How do I cook pasta?
/chat Tell me a joke
/gpt Explain quantum physics

*Available providers:* ${global.aiService.getAvailableProviders().join(', ')}
        `.trim(), { parse_mode: 'Markdown' });
      }

      // Show typing indicator
      await ctx.replyWithChatAction('typing');

      const response = await global.aiService.generateResponse(text, {
        systemPrompt: `You are a helpful AI assistant in a Telegram bot. Be concise but informative. Use emojis sparingly. If the user asks in a specific language, respond in that language.`,
        maxTokens: 1500,
        temperature: 0.7
      });

      // Split long responses
      if (response.length > 4000) {
        const parts = response.match(/.{1,4000}/g);
        for (let i = 0; i < parts.length; i++) {
          await ctx.reply(`${i === 0 ? '🤖 ' : ''}${parts[i]}`);
          if (i < parts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } else {
        await ctx.reply(`🤖 ${response}`);
      }

    } catch (error) {
      console.error('Enhanced AI error:', error);
      await ctx.reply('🚫 AI service temporarily unavailable. Please try again later.');
    }
  }
};
