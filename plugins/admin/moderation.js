const db = () => global.db;

export default {
  command: ['warn', 'mute', 'kick', 'ban', 'unwarn', 'warnings'],
  tags: ['admin'],
  help: ['/warn @user reason', '/mute @user duration', '/kick @user', '/ban @user'],
  description: 'Advanced moderation commands',
  admin: true,
  async run(ctx) {
    const chatId = ctx.chat.id.toString();
    const userId = ctx.from.id.toString();
    const command = ctx.message.text.split(' ')[0].substring(1);
    const args = ctx.message.text.split(' ').slice(1);

    const isAdmin = await this.checkAdmin(ctx, userId);
    if (!isAdmin) {
      await ctx.reply('❌ Admin only command');
      return;
    }

    let targetUser;
    if (ctx.message.reply_to_message) {
      targetUser = ctx.message.reply_to_message.from;
    } else {
      await ctx.reply('❌ Reply to a user\'s message to use this command');
      return;
    }

    const targetId = targetUser.id.toString();

    switch (command) {
      case 'warn':
        await this.warnUser(ctx, chatId, targetId, targetUser, args.join(' ') || 'No reason provided');
        break;
      case 'mute':
        await this.muteUser(ctx, chatId, targetId, targetUser, args[0] || '1h');
        break;
      case 'kick':
        await this.kickUser(ctx, chatId, targetId, targetUser, args.join(' ') || 'No reason provided');
        break;
      case 'ban':
        await this.banUser(ctx, chatId, targetId, targetUser, args.join(' ') || 'No reason provided');
        break;
      case 'unwarn':
        await this.unwarnUser(ctx, chatId, targetId, targetUser);
        break;
      case 'warnings':
        await this.showWarnings(ctx, chatId, targetId, targetUser);
        break;
    }
  },

  async checkAdmin(ctx, userId) {
    try {
      const member = await ctx.telegram.getChatMember(ctx.chat.id, userId);
      return ['administrator', 'creator'].includes(member.status);
    } catch {
      return false;
    }
  },

  async warnUser(ctx, chatId, targetId, targetUser, reason) {
    const chat = await db.getChat(chatId);
    if (!chat.warnings) chat.warnings = {};
    if (!chat.warnings[targetId]) chat.warnings[targetId] = [];

    const warning = {
      id: Date.now(),
      reason,
      by: ctx.from.id,
      timestamp: Date.now()
    };

    chat.warnings[targetId].push(warning);
    await db.setChat(chatId, chat);

    const warnCount = chat.warnings[targetId].length;
    let message = `⚠️ *Warning Issued*\n\n`;
    message += `👤 User: ${targetUser.first_name}\n`;
    message += `📝 Reason: ${reason}\n`;
    message += `🔢 Warnings: ${warnCount}/3\n`;
    message += `👮 By: ${ctx.from.first_name}`;

    if (warnCount >= 3) {
      try {
        await ctx.telegram.restrictChatMember(chatId, targetId, {
          permissions: {
            can_send_messages: false,
            can_send_media_messages: false,
            can_send_other_messages: false
          },
          until_date: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
        });
        message += `\n\n🔇 User automatically muted for 24 hours (3 warnings reached)`;
      } catch (error) {
        message += `\n\n❌ Failed to auto-mute user`;
      }
    }

    await ctx.reply(message, { parse_mode: 'Markdown' });
  },

  async muteUser(ctx, chatId, targetId, targetUser, duration) {
    const seconds = this.parseDuration(duration);
    if (!seconds) {
      await ctx.reply('❌ Invalid duration format. Use: 1m, 1h, 1d');
      return;
    }

    try {
      await ctx.telegram.restrictChatMember(chatId, targetId, {
        permissions: {
          can_send_messages: false,
          can_send_media_messages: false,
          can_send_other_messages: false
        },
        until_date: Math.floor(Date.now() / 1000) + seconds
      });

      const message = `🔇 *User Muted*\n\n`;
      message += `👤 User: ${targetUser.first_name}\n`;
      message += `⏰ Duration: ${duration}\n`;
      message += `👮 By: ${ctx.from.first_name}`;

      await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
      await ctx.reply('❌ Failed to mute user. Check bot permissions.');
    }
  },

  async kickUser(ctx, chatId, targetId, targetUser, reason) {
    try {
      await ctx.telegram.banChatMember(chatId, targetId);
      await ctx.telegram.unbanChatMember(chatId, targetId);

      let message = `👢 *User Kicked*\n\n`;
      message += `👤 User: ${targetUser.first_name}`;
      if (reason) message += `\n📝 Reason: ${reason}`;
      message += `\n👮 By: ${ctx.from.first_name}`;

      await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
      await ctx.reply('❌ Failed to kick user. Check bot permissions.');
    }
  },

  async banUser(ctx, chatId, targetId, targetUser, reason) {
    try {
      await ctx.telegram.banChatMember(chatId, targetId);

      const message = `🔨 *User Banned*\n\n`;
      message += `👤 User: ${targetUser.first_name}\n`;
      message += `📝 Reason: ${reason}\n`;
      message += `👮 By: ${ctx.from.first_name}`;

      await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
      await ctx.reply('❌ Failed to ban user. Check bot permissions.');
    }
  },

  async unwarnUser(ctx, chatId, targetId, targetUser) {
    const chat = await db.getChat(chatId);
    if (!chat.warnings || !chat.warnings[targetId] || chat.warnings[targetId].length === 0) {
      await ctx.reply('❌ User has no warnings to remove');
      return;
    }

    chat.warnings[targetId].pop();
    await db.setChat(chatId, chat);

    const message = `✅ *Warning Removed*\n\n`;
    message += `👤 User: ${targetUser.first_name}\n`;
    message += `🔢 Remaining warnings: ${chat.warnings[targetId].length}/3\n`;
    message += `👮 By: ${ctx.from.first_name}`;

    await ctx.reply(message, { parse_mode: 'Markdown' });
  },

  async showWarnings(ctx, chatId, targetId, targetUser) {
    const chat = await db.getChat(chatId);
    const warnings = chat.warnings?.[targetId] || [];

    if (warnings.length === 0) {
      await ctx.reply(`✅ ${targetUser.first_name} has no warnings`);
      return;
    }

    let message = `⚠️ *Warnings for ${targetUser.first_name}*\n\n`;

    warnings.forEach((warn, index) => {
      const date = new Date(warn.timestamp).toLocaleDateString();
      message += `${index + 1}. ${warn.reason}\n📅 ${date}\n\n`;
    });

    message += `Total: ${warnings.length}/3 warnings`;

    await ctx.reply(message, { parse_mode: 'Markdown' });
  },

  parseDuration(duration) {
    const match = duration.match(/^(\d+)([mhd])$/);
    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 60 * 60 * 24;
      default: return null;
    }
  }
};