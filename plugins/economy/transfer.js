
import { EconomySystem } from '../../lib/leveling.js';
const db = () => global.db;

export default {
  command: ['transfer', 'pay', 'give'],
  tags: ['economy'],
  help: ['/transfer @user amount - Transfer money to another user'],
  description: 'Transfer coins to another user',
  async run(ctx) {
    const userId = ctx.from.id.toString();
    const args = ctx.message.text.split(' ').slice(1);
    
    if (args.length < 2) {
      await ctx.reply('❌ Usage: /transfer @username amount\nExample: /transfer @john 1000');
      return;
    }
    
    const targetUser = args[0];
    const amount = parseInt(args[1]);
    
    if (isNaN(amount) || amount <= 0) {
      await ctx.reply('❌ Please enter a valid amount (positive number)');
      return;
    }
    
    if (amount < 100) {
      await ctx.reply('❌ Minimum transfer amount is 100 coins');
      return;
    }
    
    let targetId;
    if (ctx.message.reply_to_message) {
      targetId = ctx.message.reply_to_message.from.id.toString();
    } else if (targetUser.startsWith('@')) {
      await ctx.reply('❌ Please reply to a user\'s message or use their User ID');
      return;
    } else {
      targetId = targetUser;
    }
    
    if (targetId === userId) {
      await ctx.reply('❌ You cannot transfer money to yourself!');
      return;
    }
    
    try {
      const fee = Math.floor(amount * 0.05);
      const totalAmount = amount + fee;
      
      await EconomySystem.transfer(userId, targetId, totalAmount);
      await EconomySystem.removeMoney(userId, fee, 'transfer_fee');
      
      const targetName = ctx.message.reply_to_message 
        ? ctx.message.reply_to_message.from.first_name 
        : 'User';
      
      const message = `✅ *Transfer Successful!*

💸 Sent: ${amount.toLocaleString()} coins
👤 To: ${targetName}
💰 Fee: ${fee.toLocaleString()} coins (5%)
📊 Total: ${totalAmount.toLocaleString()} coins`;

      await ctx.reply(message, { parse_mode: 'Markdown' });
      
    } catch (error) {
      if (error.message === 'Insufficient balance') {
        const fee = Math.floor(amount * 0.05);
        const required = amount + fee;
        await ctx.reply(`❌ Insufficient balance!\n\nRequired: ${required.toLocaleString()} coins (including 5% fee)\nYour balance: ${await EconomySystem.getMoney(userId)} coins`);
      } else {
        await ctx.reply('❌ Transfer failed. Please try again later.');
      }
    }
  }
};
