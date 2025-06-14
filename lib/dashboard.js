
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class Dashboard {
  constructor(bot, config) {
    this.bot = bot;
    this.config = config;
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server);
    this.setupRoutes();
    this.setupSocketEvents();
  }

  setupRoutes() {
    this.app.use(express.static(path.join(__dirname, '..', 'public')));
    
    this.app.get('/api/stats', (req, res) => {
      const memory = process.memoryUsage();
      const stats = {
        bot: {
          name: global.namebot,
          uptime: global.performance.getUptime(),
          plugins: this.bot.plugins.size,
          users: Object.keys(global.db.data.users).length,
          chats: Object.keys(global.db.data.chats).length,
          status: this.bot.running ? 'Online' : 'Offline'
        },
        performance: global.performance.getMetrics(),
        memory: {
          used: Math.round(memory.heapUsed / 1024 / 1024),
          total: Math.round(memory.rss / 1024 / 1024),
          external: Math.round(memory.external / 1024 / 1024),
          arrayBuffers: Math.round(memory.arrayBuffers / 1024 / 1024)
        },
        system: {
          platform: process.platform,
          version: process.version,
          arch: process.arch,
          pid: process.pid
        },
        ai: global.ai ? global.ai.getStats() : { activeConversations: 0, totalMessages: 0 }
      };
      
      res.json(stats);
    });

    this.app.get('/api/users', (req, res) => {
      const users = Object.values(global.db.data.users)
        .map(u => ({
          id: u.id,
          joinDate: u.joinDate,
          lastSeen: u.lastSeen,
          totalExp: u.totalExp || 0,
          money: u.money || 0,
          dailyStreak: u.dailyStreak || 0
        }))
        .sort((a, b) => b.totalExp - a.totalExp)
        .slice(0, 50);
      
      res.json(users);
    });

    this.app.get('/api/chats', (req, res) => {
      const chats = Object.values(global.db.data.chats)
        .map(c => ({
          id: c.id,
          joinDate: c.joinDate,
          stats: c.stats || { messages: 0, commands: 0 },
          lastActivity: c.lastActivity || c.joinDate
        }))
        .sort((a, b) => b.stats.messages - a.stats.messages)
        .slice(0, 50);
      
      res.json(chats);
    });

    this.app.get('/api/logs', (req, res) => {
      try {
        const logsPath = path.join(__dirname, '..', 'data', 'logs.json');
        if (require('fs').existsSync(logsPath)) {
          const logs = JSON.parse(require('fs').readFileSync(logsPath, 'utf8'));
          res.json(logs.slice(-100).reverse());
        } else {
          res.json([]);
        }
      } catch (error) {
        res.json([]);
      }
    });

    this.app.get('/api/plugins', (req, res) => {
      const plugins = Array.from(this.bot.plugins.entries()).map(([command, plugin]) => ({
        command,
        category: plugin.category || 'main',
        description: plugin.description || 'No description',
        tags: plugin.tags || [],
        owner: plugin.owner || false,
        premium: plugin.premium || false
      }));
      
      res.json(plugins);
    });

    this.app.get('/', (req, res) => {
      res.send(`
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bot Dashboard - ${global.namebot}</title>
    <script src="/socket.io/socket.io.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            color: white;
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .status { 
            display: inline-block; 
            padding: 5px 15px; 
            border-radius: 20px; 
            font-weight: bold;
            margin-top: 10px;
        }
        .status.online { background: #4CAF50; color: white; }
        .status.offline { background: #f44336; color: white; }
        
        .grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 20px; 
            margin-bottom: 30px;
        }
        .card { 
            background: white; 
            padding: 25px; 
            border-radius: 15px; 
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        .card:hover { transform: translateY(-5px); }
        .card h3 { 
            color: #333; 
            margin-bottom: 20px; 
            font-size: 1.3em;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        .metric { 
            display: flex; 
            justify-content: space-between; 
            margin: 12px 0; 
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .metric:last-child { border-bottom: none; }
        .metric-value { 
            font-weight: bold; 
            color: #667eea; 
            font-size: 1.1em;
        }
        .metric-label { color: #666; }
        
        .large-card { grid-column: span 2; }
        .logs { 
            background: #1e1e1e; 
            color: #fff; 
            padding: 20px; 
            border-radius: 10px; 
            max-height: 400px; 
            overflow-y: auto; 
            font-family: 'Courier New', monospace;
        }
        .log-entry { 
            margin: 5px 0; 
            padding: 8px; 
            border-left: 3px solid #007bff; 
            background: rgba(255,255,255,0.05);
            border-radius: 4px;
        }
        .log-entry.error { border-left-color: #dc3545; }
        .log-entry.success { border-left-color: #28a745; }
        .log-entry.warning { border-left-color: #ffc107; }
        .log-entry.info { border-left-color: #17a2b8; }
        
        .tabs { 
            display: flex; 
            margin-bottom: 20px; 
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .tab { 
            flex: 1; 
            padding: 15px; 
            background: #f8f9fa; 
            border: none; 
            cursor: pointer; 
            font-size: 16px;
            transition: all 0.3s ease;
        }
        .tab.active { 
            background: #667eea; 
            color: white; 
        }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        
        .chart-container { height: 200px; margin: 20px 0; }
        .progress-bar {
            width: 100%;
            height: 20px;
            background: #e0e0e0;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            transition: width 0.3s ease;
        }
        
        .user-list, .chat-list, .plugin-list {
            max-height: 400px;
            overflow-y: auto;
        }
        .list-item {
            padding: 10px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .list-item:hover {
            background: #f8f9fa;
        }
        
        @media (max-width: 768px) {
            .large-card { grid-column: span 1; }
            .header h1 { font-size: 2em; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 Bot Dashboard</h1>
            <div id="bot-name">Loading...</div>
            <div id="status" class="status">Checking...</div>
            <div style="margin-top: 10px;">
                <small>Last Updated: <span id="last-update">-</span></small>
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <h3>📊 Bot Statistics</h3>
                <div class="metric">
                    <span class="metric-label">Status</span>
                    <span class="metric-value" id="bot-status">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Uptime</span>
                    <span class="metric-value" id="uptime">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Total Users</span>
                    <span class="metric-value" id="total-users">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Total Chats</span>
                    <span class="metric-value" id="total-chats">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Loaded Plugins</span>
                    <span class="metric-value" id="plugins-count">-</span>
                </div>
            </div>

            <div class="card">
                <h3>⚡ Performance</h3>
                <div class="metric">
                    <span class="metric-label">API Response</span>
                    <span class="metric-value" id="api-response">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Command Execution</span>
                    <span class="metric-value" id="command-exec">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Commands Executed</span>
                    <span class="metric-value" id="commands-count">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">AI Conversations</span>
                    <span class="metric-value" id="ai-conversations">-</span>
                </div>
            </div>

            <div class="card">
                <h3>💾 Memory Usage</h3>
                <div class="metric">
                    <span class="metric-label">Heap Used</span>
                    <span class="metric-value" id="memory-used">-</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" id="memory-progress" style="width: 0%"></div>
                </div>
                <div class="metric">
                    <span class="metric-label">Total Memory</span>
                    <span class="metric-value" id="memory-total">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">External</span>
                    <span class="metric-value" id="memory-external">-</span>
                </div>
            </div>

            <div class="card">
                <h3>🖥️ System Info</h3>
                <div class="metric">
                    <span class="metric-label">Platform</span>
                    <span class="metric-value" id="platform">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Node Version</span>
                    <span class="metric-value" id="node-version">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Architecture</span>
                    <span class="metric-value" id="architecture">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Process ID</span>
                    <span class="metric-value" id="process-id">-</span>
                </div>
            </div>
        </div>

        <div class="tabs">
            <button class="tab active" onclick="switchTab('logs')">📋 Logs</button>
            <button class="tab" onclick="switchTab('users')">👥 Users</button>
            <button class="tab" onclick="switchTab('chats')">💬 Chats</button>
            <button class="tab" onclick="switchTab('plugins')">🔌 Plugins</button>
        </div>

        <div id="logs" class="tab-content active">
            <div class="card large-card">
                <h3>📋 Recent Logs</h3>
                <div class="logs" id="logs-container">
                    <div class="log-entry">Dashboard loaded successfully</div>
                </div>
            </div>
        </div>

        <div id="users" class="tab-content">
            <div class="card large-card">
                <h3>👥 Top Users (by EXP)</h3>
                <div class="user-list" id="users-list">
                    <div class="list-item">Loading users...</div>
                </div>
            </div>
        </div>

        <div id="chats" class="tab-content">
            <div class="card large-card">
                <h3>💬 Most Active Chats</h3>
                <div class="chat-list" id="chats-list">
                    <div class="list-item">Loading chats...</div>
                </div>
            </div>
        </div>

        <div id="plugins" class="tab-content">
            <div class="card large-card">
                <h3>🔌 Loaded Plugins</h3>
                <div class="plugin-list" id="plugins-list">
                    <div class="list-item">Loading plugins...</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        
        function formatUptime(seconds) {
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            
            if (days > 0) return days + 'd ' + hours + 'h ' + minutes + 'm';
            if (hours > 0) return hours + 'h ' + minutes + 'm';
            return minutes + 'm ' + (seconds % 60) + 's';
        }

        function formatTime(timestamp) {
            return new Date(timestamp).toLocaleTimeString('id-ID');
        }

        function formatDate(timestamp) {
            return new Date(timestamp).toLocaleDateString('id-ID');
        }

        function switchTab(tabName) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            
            event.target.classList.add('active');
            document.getElementById(tabName).classList.add('active');
            
            if (tabName === 'users') loadUsers();
            if (tabName === 'chats') loadChats();
            if (tabName === 'plugins') loadPlugins();
        }

        async function loadStats() {
            try {
                const response = await fetch('/api/stats');
                const data = await response.json();
                
                document.getElementById('bot-name').textContent = data.bot.name;
                document.getElementById('bot-status').textContent = data.bot.status;
                document.getElementById('status').textContent = data.bot.status;
                document.getElementById('status').className = 'status ' + (data.bot.status === 'Online' ? 'online' : 'offline');
                
                document.getElementById('uptime').textContent = formatUptime(Math.floor(data.bot.uptime / 1000));
                document.getElementById('total-users').textContent = data.bot.users.toLocaleString();
                document.getElementById('total-chats').textContent = data.bot.chats.toLocaleString();
                document.getElementById('plugins-count').textContent = data.bot.plugins.toLocaleString();
                
                document.getElementById('api-response').textContent = Math.round(data.performance.api_call?.average || 0) + 'ms';
                document.getElementById('command-exec').textContent = Math.round(data.performance.command_execution?.average || 0) + 'ms';
                document.getElementById('commands-count').textContent = (data.performance.command_execution?.count || 0).toLocaleString();
                document.getElementById('ai-conversations').textContent = data.ai.activeConversations.toLocaleString();
                
                document.getElementById('memory-used').textContent = data.memory.used + 'MB';
                document.getElementById('memory-total').textContent = data.memory.total + 'MB';
                document.getElementById('memory-external').textContent = data.memory.external + 'MB';
                
                const memoryPercent = (data.memory.used / data.memory.total) * 100;
                document.getElementById('memory-progress').style.width = memoryPercent + '%';
                
                document.getElementById('platform').textContent = data.system.platform;
                document.getElementById('node-version').textContent = data.system.version;
                document.getElementById('architecture').textContent = data.system.arch;
                document.getElementById('process-id').textContent = data.system.pid;
                
                document.getElementById('last-update').textContent = new Date().toLocaleTimeString('id-ID');
                
                socket.emit('stats', data);
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        }

        async function loadLogs() {
            try {
                const response = await fetch('/api/logs');
                const logs = await response.json();
                
                const container = document.getElementById('logs-container');
                container.innerHTML = '';
                
                logs.forEach(log => {
                    const entry = document.createElement('div');
                    entry.className = 'log-entry ' + log.level.toLowerCase();
                    entry.innerHTML = '[' + formatTime(log.timestamp) + '] ' + 
                                    '<strong>' + log.level.toUpperCase() + '</strong>: ' + 
                                    log.message;
                    container.appendChild(entry);
                });
            } catch (error) {
                console.error('Error loading logs:', error);
            }
        }

        async function loadUsers() {
            try {
                const response = await fetch('/api/users');
                const users = await response.json();
                
                const container = document.getElementById('users-list');
                container.innerHTML = '';
                
                users.forEach((user, index) => {
                    const item = document.createElement('div');
                    item.className = 'list-item';
                    item.innerHTML = 
                        '<div>' +
                            '<strong>#' + (index + 1) + ' ID: ' + user.id + '</strong><br>' +
                            '<small>Join: ' + formatDate(user.joinDate) + ' | Last: ' + formatDate(user.lastSeen) + '</small>' +
                        '</div>' +
                        '<div>' +
                            '<div>EXP: <strong>' + user.totalExp.toLocaleString() + '</strong></div>' +
                            '<div>Money: <strong>$' + user.money.toLocaleString() + '</strong></div>' +
                        '</div>';
                    container.appendChild(item);
                });
            } catch (error) {
                console.error('Error loading users:', error);
            }
        }

        async function loadChats() {
            try {
                const response = await fetch('/api/chats');
                const chats = await response.json();
                
                const container = document.getElementById('chats-list');
                container.innerHTML = '';
                
                chats.forEach((chat, index) => {
                    const item = document.createElement('div');
                    item.className = 'list-item';
                    item.innerHTML = 
                        '<div>' +
                            '<strong>#' + (index + 1) + ' ID: ' + chat.id + '</strong><br>' +
                            '<small>Join: ' + formatDate(chat.joinDate) + '</small>' +
                        '</div>' +
                        '<div>' +
                            '<div>Messages: <strong>' + chat.stats.messages.toLocaleString() + '</strong></div>' +
                            '<div>Commands: <strong>' + chat.stats.commands.toLocaleString() + '</strong></div>' +
                        '</div>';
                    container.appendChild(item);
                });
            } catch (error) {
                console.error('Error loading chats:', error);
            }
        }

        async function loadPlugins() {
            try {
                const response = await fetch('/api/plugins');
                const plugins = await response.json();
                
                const container = document.getElementById('plugins-list');
                container.innerHTML = '';
                
                const categories = {};
                plugins.forEach(plugin => {
                    if (!categories[plugin.category]) categories[plugin.category] = [];
                    categories[plugin.category].push(plugin);
                });
                
                Object.entries(categories).forEach(([category, pluginList]) => {
                    const categoryHeader = document.createElement('div');
                    categoryHeader.style.fontWeight = 'bold';
                    categoryHeader.style.background = '#f8f9fa';
                    categoryHeader.style.padding = '10px';
                    categoryHeader.style.marginTop = '10px';
                    categoryHeader.textContent = '📁 ' + category.toUpperCase();
                    container.appendChild(categoryHeader);
                    
                    pluginList.forEach(plugin => {
                        const item = document.createElement('div');
                        item.className = 'list-item';
                        item.innerHTML = 
                            '<div>' +
                                '<strong>/' + plugin.command + '</strong><br>' +
                                '<small>' + (plugin.description || 'No description') + '</small>' +
                            '</div>' +
                            '<div>' +
                                (plugin.owner ? '<span style="color: red;">OWNER</span><br>' : '') +
                                (plugin.premium ? '<span style="color: gold;">PREMIUM</span><br>' : '') +
                                '<small>' + (plugin.tags || []).join(', ') + '</small>' +
                            '</div>';
                        container.appendChild(item);
                    });
                });
            } catch (error) {
                console.error('Error loading plugins:', error);
            }
        }

        socket.on('log', (data) => {
            const logs = document.getElementById('logs-container');
            const entry = document.createElement('div');
            entry.className = 'log-entry ' + data.level.toLowerCase();
            entry.innerHTML = '[' + formatTime(data.timestamp) + '] ' +
                            '<strong>' + data.level.toUpperCase() + '</strong>: ' + 
                            data.message;
            logs.insertBefore(entry, logs.firstChild);
            
            if (logs.children.length > 100) {
                logs.removeChild(logs.lastChild);
            }
        });
        
        loadStats();
        loadLogs();
        setInterval(loadStats, 5000);
        setInterval(loadLogs, 10000);
    </script>
</body>
</html>
      `);
    });
  }

  setupSocketEvents() {
    this.io.on('connection', (socket) => {
      global.log.info('Dashboard client connected');
      
      socket.on('disconnect', () => {
        global.log.info('Dashboard client disconnected');
      });
    });
  }

  broadcastLog(level, message) {
    this.io.emit('log', {
      level,
      message,
      timestamp: new Date().toISOString()
    });
  }

  start(port = 5000) {
    this.server.listen(port, '0.0.0.0', () => {
      global.log.success(`🌐 Dashboard running at http://0.0.0.0:${port}`);
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      global.log.info('Dashboard server stopped');
    }
  }
}

export default Dashboard;
