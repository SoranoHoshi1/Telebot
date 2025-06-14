
export default {
  command: ['imagine', 'generate', 'draw', 'create'],
  tags: ['ai'],
  help: ['/imagine <description>', '/generate <description>', '/draw <description>'],
  description: 'AI image generation using DALL-E',
  async run(ctx) {
    try {
      const prompt = ctx.message.text.split(' ').slice(1).join(' ');
      
      if (!prompt) {
        return ctx.reply(`
🎨 *AI Image Generator*

Create amazing images with AI!

*Usage:*
/imagine a sunset over mountains
/generate a cyberpunk cityscape
/draw a cute robot playing guitar

*Tips:*
• Be descriptive and specific
• Mention art style (realistic, cartoon, etc.)
• Include colors, mood, and setting
• Keep it appropriate and safe

⚡ Powered by DALL-E 3
        `.trim(), { parse_mode: 'Markdown' });
      }

      // Check if OpenAI is available
      if (!global.aiService.providers.openai) {
        return ctx.reply('🚫 Image generation requires OpenAI API key. Please contact the bot owner.');
      }

      await ctx.replyWithChatAction('upload_photo');
      await ctx.reply('🎨 Generating your image... This may take a moment.');

      const imageUrl = await global.aiService.generateImage(prompt, {
        size: '1024x1024',
        quality: 'standard'
      });

      await ctx.replyWithPhoto(
        { url: imageUrl },
        {
          caption: `🎨 *Generated Image*\n\n📝 *Prompt:* ${prompt}\n🤖 *By:* DALL-E 3`,
          parse_mode: 'Markdown'
        }
      );

    } catch (error) {
      console.error('Image generation error:', error);
      
      if (error.message.includes('content_policy_violation')) {
        await ctx.reply('🚫 Your request violates content policy. Please try a different prompt.');
      } else if (error.message.includes('quota_exceeded')) {
        await ctx.reply('⚠️ API quota exceeded. Please try again later.');
      } else {
        await ctx.reply('🚫 Image generation failed. Please try again with a different prompt.');
      }
    }
  }
};
