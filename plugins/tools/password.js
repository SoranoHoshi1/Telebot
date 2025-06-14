
export default {
  command: ['password', 'pass', 'genpass'],
  tags: ['tools', 'security'],
  help: ['/password', '/pass [length]', '/genpass [length]'],
  description: 'Generate password yang aman',
  async run(ctx) {
    try {
      const args = ctx.message.text.split(' ').slice(1);
      let length = parseInt(args[0]) || 12;
      
      if (length < 4 || length > 50) {
        return ctx.reply(`
🔐 *Password Generator*

Format: /password [panjang]
Contoh: /password 16

📏 *Panjang:* 4-50 karakter (default: 12)

🛡️ Password akan mengandung:
• Huruf besar (A-Z)
• Huruf kecil (a-z)  
• Angka (0-9)
• Simbol (!@#$%^&*)
        `.trim(), { parse_mode: 'Markdown' });
      }

      const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lowerCase = 'abcdefghijklmnopqrstuvwxyz';
      const numbers = '0123456789';
      const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      const allChars = upperCase + lowerCase + numbers + symbols;
      
      let password = '';
      
      // Ensure at least one character from each category
      password += upperCase[Math.floor(Math.random() * upperCase.length)];
      password += lowerCase[Math.floor(Math.random() * lowerCase.length)];
      password += numbers[Math.floor(Math.random() * numbers.length)];
      password += symbols[Math.floor(Math.random() * symbols.length)];
      
      // Fill the rest randomly
      for (let i = 4; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
      }
      
      // Shuffle the password
      password = password.split('').sort(() => Math.random() - 0.5).join('');
      
      // Calculate strength
      let strength = 'Lemah';
      let strengthEmoji = '🔴';
      if (length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
        if (length >= 12) {
          strength = 'Sangat Kuat';
          strengthEmoji = '🟢';
        } else {
          strength = 'Kuat';
          strengthEmoji = '🟡';
        }
      }

      const result = `
🔐 *Password Generated*

🎯 *Password:* \`${password}\`

📊 *Info:*
• Panjang: ${length} karakter
• Kekuatan: ${strengthEmoji} ${strength}

⚠️ *Tips Keamanan:*
• Jangan share password ini
• Gunakan password manager
• Aktifkan 2FA jika memungkinkan
• Ganti password secara berkala

🔄 Kirim /password lagi untuk generate ulang!
      `.trim();

      ctx.reply(result, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Password Generator Error:', error);
      ctx.reply('⚠️ Gagal generate password. Coba lagi nanti.');
    }
  }
};
