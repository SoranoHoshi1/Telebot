export default {
  command: ['slots', 'slot'],
  tags: ['games'],
  help: ['/slots <amount>'],
  description: 'Main slot machine',
  async run(ctx) {
    const args = ctx.message.text.split(' ').slice(1);
    const userId = ctx.from.id.toString();
    const user = global.db.getUser(userId);

    if (!args[0] || isNaN(args[0])) {
      return await ctx.reply('❌ Masukkan jumlah taruhan yang valid!\nContoh: /slots 100');
    }

    const bet = parseInt(args[0]);

    if (bet < 10) {
      return await ctx.reply('❌ Taruhan minimum $10');
    }

    if (bet > user.money) {
      return await ctx.reply(`❌ Saldo tidak cukup! Saldo Anda: $${user.money}`);
    }

    const slots = ['🍎', '🍌', '🍇', '🍊', '🔔', '💎', '7️⃣'];
    const reel1 = slots[Math.floor(Math.random() * slots.length)];
    const reel2 = slots[Math.floor(Math.random() * slots.length)];
    const reel3 = slots[Math.floor(Math.random() * slots.length)];

    let multiplier = 0;
    let result = '';

    if (reel1 === reel2 && reel2 === reel3) {
      if (reel1 === '💎') {
        multiplier = 10;
        result = 'JACKPOT! 💎💎💎';
      } else if (reel1 === '7️⃣') {
        multiplier = 7;
        result = 'LUCKY SEVEN! 7️⃣7️⃣7️⃣';
      } else {
        multiplier = 5;
        result = 'TRIPLE MATCH!';
      }
    } else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
      multiplier = 2;
      result = 'DOUBLE MATCH!';
    } else {
      result = 'NO MATCH';
    }

    const winnings = bet * multiplier;
    const profit = winnings - bet;

    user.money -= bet;
    if (winnings > 0) {
      user.money += winnings;
    }

    const message = `🎰 *SLOT MACHINE* 🎰\n\n` +
      `${reel1} | ${reel2} | ${reel3}\n\n` +
      `${result}\n\n` +
      `💰 Taruhan: $${bet}\n` +
      `${profit > 0 ? '🎉' : profit === 0 ? '😐' : '💸'} ${profit > 0 ? 'Menang' : profit === 0 ? 'Seri' : 'Kalah'}: $${Math.abs(profit)}\n` +
      `💳 Saldo: $${user.money}`;

    await ctx.reply(message, { parse_mode: 'Markdown' });
  }
};