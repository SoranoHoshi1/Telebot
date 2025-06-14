
import { Dashboard } from '../../lib/dashboard.js';

export default {
  command: ['dashboard', 'panel', 'web'],
  tags: ['admin'],
  help: ['/dashboard'],
  description: 'Akses web dashboard lengkap',
  owner: true,
  async run(ctx) {
    if (!global.dashboard) {
      global.dashboard = new Dashboard(global.bot, global.config);
      global.dashboard.start(5000);
    }
    
    const replUrl = process.env.REPL_SLUG && process.env.REPL_OWNER 
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co:5000`
      : 'http://localhost:5000';
    
    ctx.reply(`
📊 *Advanced Web Dashboard*

🌐 *URL:* ${replUrl}

📈 *Real-time Features:*
• 🤖 Bot status & statistics
• ⚡ Performance monitoring
• 💾 Memory usage tracking
• 👥 User management & leaderboard
• 💬 Chat activity monitoring
• 🔌 Plugin management
• 📋 Live logs streaming
• 🔍 System information

📱 *Responsive Design:*
• Mobile-friendly interface
• Real-time updates via WebSocket
• Interactive charts & graphs
• Dark/Light mode logs

🛡️ *Security:*
• Owner-only access
• Real-time system monitoring
• Performance analytics

💡 *Tip:* Dashboard otomatis refresh setiap 5 detik untuk data terbaru!
    `.trim(), { parse_mode: 'Markdown' });
  }
};
