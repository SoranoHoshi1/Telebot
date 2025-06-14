
import { LevelingSystem, EconomySystem } from '../../lib/leveling.js';
const db = () => global.db;

export default {
  command: ['leaderboard', 'lb', 'top', 'rank'],
  tags: ['economy'],
  help: ['/leaderboard - View top users by level and balance'],
  description: 'Display leaderboard of top users',
  async run(ctx) {
    const args = ctx.message.text.split(' ');
    const type = args[1] || 'level';
    
    try {
      let leaderboard;
      let title;
      let emoji;
      
      if (type === 'money' || type === 'balance' || type === 'rich') {
        const users = await global.db.list('user:*');
        const richList = [];
        
        for (const userKey of users) {
          const user = await global.db.get(userKey);
          if (user && user.balance > 0) {
            richList.push({
              id: user.id,
              balance: user.balance,
              username: user.username || 'Unknown'
            });
          }
        }
        
        leaderboard = richList
          .sort((a, b) => b.balance - a.balance)
          .slice(0, 10);
        
        title = '💰 *Richest Users*';
        emoji = '💵';
        
      } else {
        leaderboard = await LevelingSystem.getLeaderboard(10);
        title = '🏆 *Level Leaderboard*';
        emoji = '⭐';
      }
      
      if (leaderboard.length === 0) {
        await ctx.reply('📊 No users found in leaderboard yet!');
        return;
      }
      
      let message = `${title}\n\n`;
      
      for (let i = 0; i < leaderboard.length; i++) {
        const user = leaderboard[i];
        const rank = i + 1;
        const medal = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `${rank}.`;
        
        if (type === 'money' || type === 'balance' || type === 'rich') {
          message += `${medal} ${user.username}\n${emoji} ${user.balance.toLocaleString()} coins\n\n`;
        } else {
          message += `${medal} ${user.username}\n${emoji} Level ${user.level} (${user.totalExp.toLocaleString()} EXP)\n\n`;
        }
      }
      
      const userId = ctx.from.id.toString();
      if (type === 'money' || type === 'balance' || type === 'rich') {
        const userBalance = await EconomySystem.getMoney(userId);
        message += `\n💰 Your balance: ${userBalance.toLocaleString()} coins`;
      } else {
        const user = await global.db.getUser(userId);
        message += `\n⭐ Your level: ${user.level || 1} (${user.totalExp || 0} EXP)`;
      }
      
      await ctx.reply(message, { parse_mode: 'Markdown' });
      
    } catch (error) {
      await ctx.reply('❌ Failed to load leaderboard. Please try again later.');
    }
  }
};
