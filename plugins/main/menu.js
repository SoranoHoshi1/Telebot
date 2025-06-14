export default {
  command: ['menu', 'help', 'start'],
  tags: ['main'],
  help: ['/menu', '/help', '/start'],
  description: 'Menampilkan menu utama bot',
  async run(ctx) {
    const userId = ctx.from.id.toString();
    const user = global.db.getUser(userId);

    const now = new Date();
    const timeString = now.toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const menu = `
🤖 *${global.namebot}*

👤 *User Info:*
• Name: ${ctx.from.first_name}
• ID: ${userId}
• Level: ${Math.floor(user.totalExp / 100) + 1}
• XP: ${user.totalExp}
• Money: $${user.money.toLocaleString()}

🕒 *Time:* ${timeString}

📋 *Menu Categories:*

🧠 *AI & Chat*
• /ai <pertanyaan> - Chat dengan AI
• /personality - Ubah kepribadian AI
• /clear - Reset chat history

💰 *Economy*
• /balance - Cek saldo
• /daily - Bonus harian
• /transfer <jumlah> @user - Transfer uang
• /leaderboard - Ranking kekayaan

🎮 *Games*
• /casino <amount> - Main casino
• /slots <amount> - Main slot machine
• /tictactoe - Tic tac toe

🔧 *Tools*
• /calc <expression> - Kalkulator
• /qr <text> - Generate QR code
• /translate <text> - Translate text
• /weather <city> - Cuaca

ℹ️ *Info*
• /help - Menu bantuan
• /speed - Test kecepatan bot
• /owner - Info owner

👑 *Admin* (Group only)
• /warn @user - Beri peringatan
• /mute @user <duration> - Mute user
• /kick @user - Kick user
• /ban @user - Ban user

⚡ Total ${global.bot?.plugins?.size || 0} commands available
    `.trim();

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🧠 AI Commands', callback_data: 'menu_ai' },
          { text: '💰 Economy', callback_data: 'menu_economy' }
        ],
        [
          { text: '🎮 Games', callback_data: 'menu_games' },
          { text: '🔧 Tools', callback_data: 'menu_tools' }
        ],
        [
          { text: '📊 Statistics', callback_data: 'menu_stats' },
          { text: '❓ Help', callback_data: 'menu_help' }
        ]
      ]
    };

    await ctx.reply(menu, { 
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  },

  callbackPattern: /^menu_/,
  async handleCallback(ctx) {
    const data = ctx.callbackQuery.data;

    let response = '';

    switch(data) {
      case 'menu_ai':
        response = `🧠 *AI Commands*\n\n• /ai <text> - Chat dengan AI\n• /personality - Ganti personality\n• /clear - Reset chat`;
        break;
      case 'menu_economy':
        response = `💰 *Economy Commands*\n\n• /balance - Cek saldo\n• /daily - Bonus harian\n• /transfer - Transfer uang\n• /leaderboard - Ranking`;
        break;
      case 'menu_games':
        response = `🎮 *Game Commands*\n\n• /casino - Main casino\n• /slots - Slot machine\n• /tictactoe - Tic tac toe`;
        break;
      case 'menu_tools':
        response = `🔧 *Tool Commands*\n\n• /calc - Kalkulator\n• /qr - QR generator\n• /translate - Translate\n• /weather - Cuaca`;
        break;
      case 'menu_stats':
        response = `📊 *Bot Statistics*\n\n• Users: ${Object.keys(global.db.data.users).length}\n• Uptime: ${global.Utils.formatDuration(global.performance.getUptime())}\n• Commands: ${global.bot?.plugins?.size || 0}`;
        break;
      case 'menu_help':
        response = `❓ *Need Help?*\n\nGunakan /help <command> untuk bantuan spesifik\nAtau hubungi owner: ${global.config.owner[0]?.[1] || 'Unknown'}`;
        break;
    }

    await ctx.editMessageText(response, { parse_mode: 'Markdown' });
  }
};