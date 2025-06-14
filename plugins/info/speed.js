export default {
  command: ['speed', 'ping', 'test'],
  tags: ['info'],
  help: ['/speed'],
  description: 'Test kecepatan dan latency bot',
  async run(ctx) {
    const start = Date.now();

    const message = await ctx.reply('⏱️ Testing speed...');

    const latency = Date.now() - start;
    const uptime = global.performance.getUptime();
    const metrics = global.performance.getMetrics();

    function formatBytes(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function formatDuration(ms) {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
      if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
      if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
      return `${seconds}s`;
    }

    const memUsage = process.memoryUsage();

    const speedInfo = `⚡ *Bot Performance*\n\n` +
      `🏓 Latency: ${latency}ms\n` +
      `⏰ Uptime: ${formatDuration(uptime)}\n` +
      `💾 Memory: ${formatBytes(memUsage.rss)}\n` +
      `📊 Heap: ${formatBytes(memUsage.heapUsed)} / ${formatBytes(memUsage.heapTotal)}\n` +
      `🔄 Plugins: ${global.bot?.plugins?.size || 0}\n` +
      `👥 Users: ${Object.keys(global.db?.data?.users || {}).length}\n\n` +
      `📈 *Average Metrics:*\n` +
      `• API Calls: ${metrics.api_call?.average?.toFixed(2) || 0}ms\n` +
      `• Commands: ${metrics.command_execution?.average?.toFixed(2) || 0}ms\n` +
      `• Requests: ${metrics.request_duration?.average?.toFixed(2) || 0}ms`;

    await ctx.reply(
      speedInfo,
      { parse_mode: 'Markdown' }
    );
  }
};