
import { EconomySystem } from '../../lib/leveling.js';
const db = () => global.db;

export default {
  command: ['daily', 'claim'],
  tags: ['economy'],
  help: ['/daily - Claim your daily reward'],
  description: 'Claim daily coins and maintain your streak',
  async run(ctx) {
    const userId = ctx.from.id.toString();
    
    try {
      const result = await EconomySystem.daily(userId);
      
      if (!result.success) {
        const hours = Math.floor(result.timeLeft);
        const minutes = Math.floor((result.timeLeft - hours) * 60);
        
        await ctx.reply(`⏰ Daily reward already claimed!\n\nNext reward available in: ${hours}h ${minutes}m`);
        return;
      }
      
      const message = `🎁 *Daily Reward Claimed!*

💰 Reward: ${result.reward.toLocaleString()} coins
🔥 Streak: ${result.streak} days
🎯 Streak Bonus: ${EconomySystem.getStreakBonus(result.streak - 1)} coins

Come back tomorrow to maintain your streak!`;

      await ctx.reply(message, { parse_mode: 'Markdown' });
      
    } catch (error) {
      await ctx.reply('❌ Failed to claim daily reward. Please try again later.');
    }
  }
};
