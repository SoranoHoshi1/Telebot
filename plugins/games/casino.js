
export default {
  command: ['casino', 'bet', 'gamble'],
  tags: ['games', 'economy'],
  help: ['/casino <amount>', '/bet <amount>'],
  description: 'Casino game dengan berbagai pilihan',
  async run(ctx) {
    const args = ctx.message.text.split(' ').slice(1);
    const betAmount = parseInt(args[0]);
    const userId = ctx.from.id.toString();
    const user = global.db.getUser(userId);

    if (!betAmount || betAmount < 100) {
      return ctx.reply('🎰 *CASINO*\n\nMinimal bet: 100 coins\nFormat: /casino <amount>');
    }

    if (betAmount > user.money) {
      return ctx.reply('💸 Uang tidak cukup!');
    }

    const games = [
      { name: 'Slot Machine', emoji: '🎰', multiplier: 2.5 },
      { name: 'Roulette', emoji: '🎡', multiplier: 3.0 },
      { name: 'Blackjack', emoji: '🂡', multiplier: 2.0 },
      { name: 'Dice', emoji: '🎲', multiplier: 6.0 }
    ];

    const selectedGame = games[Math.floor(Math.random() * games.length)];
    const winChance = Math.random();
    const won = winChance < (1 / selectedGame.multiplier);

    user.money -= betAmount;

    if (won) {
      const winAmount = Math.floor(betAmount * selectedGame.multiplier);
      user.money += winAmount;
      
      ctx.reply(`
🎉 *JACKPOT!*

${selectedGame.emoji} Game: ${selectedGame.name}
💰 Bet: ${betAmount.toLocaleString()} coins
🏆 Win: ${winAmount.toLocaleString()} coins
💳 Balance: ${user.money.toLocaleString()} coins
      `.trim());
    } else {
      ctx.reply(`
😭 *KALAH!*

${selectedGame.emoji} Game: ${selectedGame.name}
💸 Lost: ${betAmount.toLocaleString()} coins
💳 Balance: ${user.money.toLocaleString()} coins
      `.trim());
    }
  }
};
