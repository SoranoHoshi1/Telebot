
export default {
  command: ['monitor', 'status', 'health'],
  tags: ['admin'],
  help: ['/monitor'],
  description: 'Monitor sistem bot',
  owner: true,
  async run(ctx) {
    try {
      const stats = global.performance.getMetrics();
      const dbStats = global.db.getStats();
      const memUsage = process.memoryUsage();
      
      const text = `
📊 *System Monitor*

🚀 *Performance:*
• Uptime: ${global.Utils.formatDuration(global.performance.getUptime())}
• Avg Response: ${stats.api_call?.average?.toFixed(2) || 0}ms
• Commands: ${stats.command_execution?.count || 0}

💾 *Memory:*
• Used: ${global.Utils.formatBytes(memUsage.used)}
• Total: ${global.Utils.formatBytes(memUsage.rss)}
• Heap: ${global.Utils.formatBytes(memUsage.heapUsed)}

📚 *Database:*
• Users: ${Object.keys(global.db.data.users).length}
• Chats: ${Object.keys(global.db.data.chats).length}
• Size: ${global.Utils.formatBytes(dbStats.databaseSize)}

🤖 *AI Stats:*
• Conversations: ${global.ai.getStats().activeConversations}
• Messages: ${global.ai.getStats().totalMessages}

🔌 *Bot:*
• Plugins: ${global.bot.plugins.size}
• Mode: ${global.config.webhook.enabled ? 'Webhook' : 'Polling'}
      `.trim();

      ctx.reply(text, { parse_mode: 'Markdown' });
    } catch (error) {
      global.log.error('Monitor error:', error);
      ctx.reply('❌ Error getting system stats');
    }
  }
};
