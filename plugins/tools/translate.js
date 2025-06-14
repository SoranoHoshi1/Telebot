
export default {
  command: ['translate', 'tr', 'terjemah'],
  tags: ['tools', 'internet'],
  help: ['/translate <text>', '/tr <text>', '/terjemah <text>'],
  description: 'Terjemahkan text ke berbagai bahasa',
  async run(ctx) {
    try {
      const args = ctx.message.text.split(' ').slice(1);
      if (args.length === 0) {
        return ctx.reply(`
🌐 *Translator*

Format penggunaan:
• /translate <text> - Auto detect → Indonesia
• /tr en:id Hello World - English → Indonesia  
• /tr id:en Halo Dunia - Indonesia → English

📋 *Kode Bahasa:*
• id = Indonesia
• en = English  
• ja = Japanese
• ko = Korean
• zh = Chinese
• ar = Arabic
• es = Spanish
• fr = French
• de = German
• ru = Russian

Contoh: /tr en:id Hello World
        `.trim(), { parse_mode: 'Markdown' });
      }

      let sourceLang = 'auto';
      let targetLang = 'id';
      let text = args.join(' ');

      // Parse language codes if provided (format: source:target text)
      if (args[0].includes(':') && args[0].length <= 7) {
        const [source, target] = args[0].split(':');
        if (source && target) {
          sourceLang = source;
          targetLang = target;
          text = args.slice(1).join(' ');
        }
      }

      if (!text) {
        return ctx.reply('❌ Masukkan text yang akan diterjemahkan!');
      }

      await ctx.reply('🌐 Menerjemahkan...');

      // Simple translation using Google Translate (free endpoint)
      const encodedText = encodeURIComponent(text);
      const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodedText}`;

      try {
        const response = await fetch(translateUrl);
        const data = await response.json();
        
        if (!data || !data[0] || !data[0][0]) {
          throw new Error('Translation failed');
        }

        const translatedText = data[0][0][0];
        const detectedLang = data[2] || sourceLang;
        
        const langNames = {
          'id': 'Indonesia', 'en': 'English', 'ja': 'Japanese', 
          'ko': 'Korean', 'zh': 'Chinese', 'ar': 'Arabic',
          'es': 'Spanish', 'fr': 'French', 'de': 'German', 'ru': 'Russian'
        };

        const result = `
🌐 *Translation Result*

📝 *Original (${langNames[detectedLang] || detectedLang}):*
${text}

🔄 *Translation (${langNames[targetLang] || targetLang}):*
${translatedText}

🗣️ ${detectedLang} → ${targetLang}
        `.trim();

        ctx.reply(result, { parse_mode: 'Markdown' });
      } catch (translateError) {
        // Fallback simple translations
        const simpleTranslations = {
          'hello': 'halo', 'world': 'dunia', 'good': 'baik', 'morning': 'pagi',
          'halo': 'hello', 'dunia': 'world', 'baik': 'good', 'pagi': 'morning',
          'terima kasih': 'thank you', 'thank you': 'terima kasih'
        };

        const simple = simpleTranslations[text.toLowerCase()];
        if (simple) {
          ctx.reply(`🌐 *Simple Translation:*\n\n${text} → ${simple}`);
        } else {
          throw translateError;
        }
      }
    } catch (error) {
      console.error('Translation Error:', error);
      ctx.reply('⚠️ Gagal menerjemahkan text. Coba lagi nanti atau gunakan format yang benar.');
    }
  }
};
