
export default {
  command: ['calc', 'kalkulator', 'hitung'],
  tags: ['tools'],
  help: ['/calc <operasi>', '/kalkulator <operasi>', '/hitung <operasi>'],
  description: 'Kalkulator sederhana untuk operasi matematika',
  async run(ctx) {
    try {
      const expression = ctx.message.text.split(' ').slice(1).join(' ');
      if (!expression) {
        return ctx.reply(`
🧮 *Kalkulator*

Gunakan format:
• /calc 2 + 3
• /calc 10 * 5
• /calc 100 / 4
• /calc 2^3 (pangkat)
• /calc sqrt(16) (akar kuadrat)

📝 *Operator yang didukung:*
+ (tambah) - (kurang) * (kali) / (bagi)
^ (pangkat) sqrt() (akar kuadrat)
sin() cos() tan() (trigonometri)
        `.trim(), { parse_mode: 'Markdown' });
      }

      // Sanitize input
      const sanitized = expression
        .replace(/[^0-9+\-*/().\s^]/g, '')
        .replace(/\^/g, '**')
        .replace(/sqrt\(([^)]+)\)/g, 'Math.sqrt($1)')
        .replace(/sin\(([^)]+)\)/g, 'Math.sin($1)')
        .replace(/cos\(([^)]+)\)/g, 'Math.cos($1)')
        .replace(/tan\(([^)]+)\)/g, 'Math.tan($1)');

      if (!sanitized) {
        return ctx.reply('❌ Format tidak valid! Gunakan angka dan operator matematika.');
      }

      try {
        const result = eval(sanitized);
        if (isNaN(result) || !isFinite(result)) {
          throw new Error('Invalid result');
        }

        const response = `
🧮 *Hasil Perhitungan*

📝 *Operasi:* ${expression}
📊 *Hasil:* ${result}

${result % 1 !== 0 ? `🔢 *Pembulatan:* ${Math.round(result * 100) / 100}` : ''}
        `.trim();

        ctx.reply(response, { parse_mode: 'Markdown' });
      } catch (evalError) {
        ctx.reply('❌ Operasi tidak valid! Periksa format perhitungan Anda.');
      }
    } catch (error) {
      console.error('Calculator Error:', error);
      ctx.reply('⚠️ Gagal melakukan perhitungan. Coba lagi nanti.');
    }
  }
};
