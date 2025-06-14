import { EconomySystem, LevelingSystem } from '../../lib/leveling.js';
const db = () => global.db;

export default {
  command: ['balance', 'bal', 'money', 'duit'],
  tags: ['economy'],
  help: ['/balance - Check your balance'],
  description: 'Check your current balance and level',
  async run(ctx) {
    const userId = ctx.from.id.toString();
    const balance = await EconomySystem.getMoney(userId);
    const user = await global.db.getUser(userId);

    const levelData = LevelingSystem.calculateLevel(user.totalExp || 0);
    const progressBar = '█'.repeat(Math.floor((levelData.currentExp / levelData.requiredExp) * 10));
    const emptyBar = '░'.repeat(10 - progressBar.length);

    const message = `💰 *Your Profile*

👤 User: ${ctx.from.first_name}
💵 Balance: ${balance.toLocaleString()} coins
📊 Level: ${levelData.level}
⭐ EXP: ${levelData.currentExp}/${levelData.requiredExp}
📈 Progress: [${progressBar}${emptyBar}] ${Math.floor((levelData.currentExp / levelData.requiredExp) * 100)}%
📅 Member since: ${new Date(user.joinDate).toLocaleDateString()}`;

    await ctx.reply(message, { parse_mode: 'Markdown' });
  }
};