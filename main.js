
import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import { AdvancedAI } from './lib/advanced-ai.js';
import { WebhookManager } from './lib/webhook.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

global.config = config;
global.namebot = config.namebot || 'TelegramBot';
global.db = null;

class AdvancedLogger {
  static log(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message: typeof message === 'string' ? message : JSON.stringify(message), args };

    console.log(`[${timestamp}] ${level.toUpperCase()}: ${logEntry.message}`, ...args);

    try {
      const logFile = join(__dirname, 'data', 'logs.json');
      if (!fs.existsSync(join(__dirname, 'data'))) {
        fs.mkdirSync(join(__dirname, 'data'), { recursive: true });
      }

      let logs = [];
      if (fs.existsSync(logFile)) {
        try {
          logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        } catch (e) {
          logs = [];
        }
      }

      logs.push(logEntry);
      if (logs.length > 1000) logs = logs.slice(-500);

      fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));

      if (global.dashboard) {
        global.dashboard.broadcastLog(level, logEntry.message);
      }
    } catch (e) {
      console.error('Failed to write log:', e);
    }
  }

  static info(message, ...args) { this.log('info', message, ...args); }
  static warn(message, ...args) { this.log('warn', message, ...args); }
  static error(message, ...args) { this.log('error', message, ...args); }
  static success(message, ...args) { this.log('success', message, ...args); }
}

global.log = AdvancedLogger;

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.startTime = Date.now();
  }

  addMetric(name, value) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name).push({ value, timestamp: Date.now() });

    const values = this.metrics.get(name);
    if (values.length > 100) {
      this.metrics.set(name, values.slice(-50));
    }
  }

  getMetrics() {
    const result = {};
    for (const [name, values] of this.metrics) {
      if (values.length > 0) {
        const recent = values.slice(-10);
        const avg = recent.reduce((sum, item) => sum + item.value, 0) / recent.length;
        result[name] = { average: avg, count: values.length, recent: recent.length };
      }
    }
    return result;
  }

  getUptime() {
    return Date.now() - this.startTime;
  }
}

global.performance = new PerformanceMonitor();

class DatabaseManager {
  constructor() {
    this.dbPath = join(__dirname, 'data', 'database.json');
    this.data = this.loadDatabase();
    this.saveInterval = setInterval(() => this.saveDatabase(), 30000);
  }

  loadDatabase() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const data = JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
        return {
          users: data.users || {},
          chats: data.chats || {},
          settings: data.settings || {},
          ...data
        };
      }
    } catch (e) {
      AdvancedLogger.error('Database load error:', e);
    }
    return { users: {}, chats: {}, settings: {} };
  }

  saveDatabase() {
    try {
      if (!fs.existsSync(join(__dirname, 'data'))) {
        fs.mkdirSync(join(__dirname, 'data'), { recursive: true });
      }
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
    } catch (e) {
      AdvancedLogger.error('Database save error:', e);
    }
  }

  getUser(userId) {
    if (!this.data.users[userId]) {
      this.data.users[userId] = {
        id: userId,
        joinDate: Date.now(),
        lastSeen: Date.now(),
        totalExp: 0,
        money: 1000,
        dailyStreak: 0,
        lastDaily: 0,
        settings: {}
      };
    }
    this.data.users[userId].lastSeen = Date.now();
    return this.data.users[userId];
  }

  updateUser(userId, updates) {
    const user = this.getUser(userId);
    Object.assign(user, updates);
    return user;
  }

  getChat(chatId) {
    if (!this.data.chats[chatId]) {
      this.data.chats[chatId] = {
        id: chatId,
        joinDate: Date.now(),
        settings: {},
        stats: { messages: 0, commands: 0 }
      };
    }
    return this.data.chats[chatId];
  }
}

class Utils {
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  static isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.replace(/[<>]/g, '').trim();
  }

  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

global.Utils = Utils;

class TelegramBot {
  constructor(token) {
    this.token = token;
    this.baseURL = `https://api.telegram.org/bot${token}`;
    this.offset = 0;
    this.plugins = new Map();
    this.running = false;
    this.rateLimiter = new Map();
  }

  async apiCall(method, params = {}) {
    try {
      const url = `${this.baseURL}/${method}`;
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      };

      const startTime = Date.now();
      const response = await fetch(url, options);
      const duration = Date.now() - startTime;
      
      global.performance.addMetric('api_call', duration);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(`Telegram API Error: ${result.description}`);
      }

      return result.result;
    } catch (error) {
      AdvancedLogger.error(`API Call Error (${method}):`, error.message);
      throw error;
    }
  }

  async sendMessage(chatId, text, options = {}) {
    const params = {
      chat_id: chatId,
      text: text,
      ...options
    };
    
    if (params.text.length > 4096) {
      params.text = params.text.substring(0, 4093) + '...';
    }

    return await this.apiCall('sendMessage', params);
  }

  async sendPhoto(chatId, photo, options = {}) {
    const params = {
      chat_id: chatId,
      photo: photo,
      ...options
    };
    return await this.apiCall('sendPhoto', params);
  }

  async sendDocument(chatId, document, options = {}) {
    const params = {
      chat_id: chatId,
      document: document,
      ...options
    };
    return await this.apiCall('sendDocument', params);
  }

  async sendContact(chatId, phoneNumber, firstName, options = {}) {
    const params = {
      chat_id: chatId,
      phone_number: phoneNumber,
      first_name: firstName,
      ...options
    };
    return await this.apiCall('sendContact', params);
  }

  async editMessageText(chatId, messageId, text, options = {}) {
    const params = {
      chat_id: chatId,
      message_id: messageId,
      text: text,
      ...options
    };
    return await this.apiCall('editMessageText', params);
  }

  async deleteMessage(chatId, messageId) {
    return await this.apiCall('deleteMessage', {
      chat_id: chatId,
      message_id: messageId
    });
  }

  async banChatMember(chatId, userId) {
    return await this.apiCall('banChatMember', {
      chat_id: chatId,
      user_id: userId
    });
  }

  async unbanChatMember(chatId, userId) {
    return await this.apiCall('unbanChatMember', {
      chat_id: chatId,
      user_id: userId
    });
  }

  async restrictChatMember(chatId, userId, permissions) {
    return await this.apiCall('restrictChatMember', {
      chat_id: chatId,
      user_id: userId,
      permissions: permissions
    });
  }

  async answerCallbackQuery(callbackQueryId, text = '', showAlert = false) {
    return await this.apiCall('answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      text: text,
      show_alert: showAlert
    });
  }

  async getMe() {
    return await this.apiCall('getMe');
  }

  async getUpdates(offset = 0, limit = 100, timeout = 30) {
    return await this.apiCall('getUpdates', {
      offset: offset,
      limit: limit,
      timeout: timeout,
      allowed_updates: ['message', 'callback_query', 'inline_query']
    });
  }

  async processUpdate(update) {
    try {
      const ctx = this.createContext(update);
      
      if (update.message) {
        await this.handleMessage(ctx);
      } else if (update.callback_query) {
        await this.handleCallbackQuery(ctx);
      } else if (update.inline_query) {
        await this.handleInlineQuery(ctx);
      }
    } catch (error) {
      AdvancedLogger.error('Update processing error:', error);
    }
  }

  createContext(update) {
    const ctx = {
      update: update,
      bot: this,
      telegram: this
    };

    if (update.message) {
      ctx.message = update.message;
      ctx.chat = update.message.chat;
      ctx.from = update.message.from;
    } else if (update.callback_query) {
      ctx.callbackQuery = update.callback_query;
      ctx.chat = update.callback_query.message.chat;
      ctx.from = update.callback_query.from;
      ctx.message = update.callback_query.message;
    }

    ctx.reply = async (text, options = {}) => {
      return await this.sendMessage(ctx.chat.id, text, options);
    };

    ctx.replyWithPhoto = async (photo, options = {}) => {
      return await this.sendPhoto(ctx.chat.id, photo, options);
    };

    ctx.replyWithDocument = async (document, options = {}) => {
      return await this.sendDocument(ctx.chat.id, document, options);
    };

    ctx.replyWithContact = async (phoneNumber, firstName, options = {}) => {
      return await this.sendContact(ctx.chat.id, phoneNumber, firstName, options);
    };

    ctx.editMessageText = async (text, options = {}) => {
      if (ctx.callbackQuery) {
        return await this.editMessageText(ctx.chat.id, ctx.message.message_id, text, options);
      }
    };

    ctx.answerCbQuery = async (text = '', showAlert = false) => {
      if (ctx.callbackQuery) {
        return await this.answerCallbackQuery(ctx.callbackQuery.id, text, showAlert);
      }
    };

    ctx.deleteMessage = async () => {
      if (ctx.message) {
        return await this.deleteMessage(ctx.chat.id, ctx.message.message_id);
      }
    };

    return ctx;
  }

  async handleMessage(ctx) {
    const startTime = Date.now();

    try {
      const userId = ctx.from?.id?.toString();
      const chatId = ctx.chat?.id?.toString();
      const messageText = ctx.message.text || '';

      if (userId) {
        global.db.getUser(userId);
      }
      
      if (chatId) {
        const chat = global.db.getChat(chatId);
        chat.stats.messages++;
      }

      if (messageText.startsWith('/')) {
        const command = messageText.split(' ')[0].substring(1).split('@')[0];
        await this.executeCommand(ctx, command);
      } else {
        if (userId) {
          const user = global.db.getUser(userId);
          const expGain = Math.floor(Math.random() * 5) + 1;
          user.totalExp = (user.totalExp || 0) + expGain;
        }
      }

    } catch (error) {
      AdvancedLogger.error('Message handler error:', error);
    } finally {
      const duration = Date.now() - startTime;
      global.performance.addMetric('request_duration', duration);
    }
  }

  async handleCallbackQuery(ctx) {
    try {
      const data = ctx.callbackQuery.data;
      
      for (const [command, plugin] of this.plugins) {
        if (plugin.callbackPattern) {
          const pattern = plugin.callbackPattern instanceof RegExp ? 
            plugin.callbackPattern : new RegExp(`^${plugin.callbackPattern}$`);
          
          if (pattern.test(data)) {
            const userId = ctx.from?.id?.toString();
            const chatId = ctx.chat?.id?.toString();
            
            const { allowed, message } = this.hasPermission(plugin, userId, chatId);
            if (!allowed) {
              await ctx.answerCbQuery(message);
              return;
            }

            await plugin.run(ctx);
            return;
          }
        }
      }
    } catch (error) {
      AdvancedLogger.error('Callback query handler error:', error);
    }
  }

  async handleInlineQuery(ctx) {
    try {
      
    } catch (error) {
      AdvancedLogger.error('Inline query handler error:', error);
    }
  }

  async executeCommand(ctx, command) {
    const startTime = Date.now();

    try {
      const plugin = this.plugins.get(command);
      if (!plugin) return;

      const userId = ctx.from?.id?.toString();
      const chatId = ctx.chat?.id?.toString();

      if (!userId) return;

      const { allowed, message } = this.hasPermission(plugin, userId, chatId);
      if (!allowed) {
        return await ctx.reply(message);
      }

      if (chatId) {
        const chat = global.db.getChat(chatId);
        chat.stats.commands++;
      }

      await plugin.run(ctx);

      const duration = Date.now() - startTime;
      global.performance.addMetric('command_execution', duration);

      AdvancedLogger.success(`Command '/${command}' berhasil dijalankan oleh User ${userId}`);

    } catch (error) {
      AdvancedLogger.error(`Error menjalankan command '/${command}':`, error);
      await ctx.reply('⚠️ Terjadi kesalahan dalam menjalankan perintah.');
    }
  }

  hasPermission(plugin, userId, chatId) {
    if (plugin.owner && !config.owner.some(([id]) => id === userId)) {
      return { allowed: false, message: 'Perintah ini khusus untuk owner bot' };
    }

    if (plugin.premium && !config.premium?.includes(userId)) {
      return { allowed: false, message: 'Fitur premium diperlukan' };
    }

    if (plugin.group && chatId > 0) {
      return { allowed: false, message: 'Perintah ini hanya bisa digunakan di grup' };
    }

    if (plugin.private && chatId < 0) {
      return { allowed: false, message: 'Perintah ini hanya bisa digunakan di chat pribadi' };
    }

    return { allowed: true };
  }

  async loadPlugins() {
    const pluginsDir = join(__dirname, 'plugins');

    async function loadDirectory(dir, category = '') {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          await loadDirectory.call(this, fullPath, item);
        } else if (item.endsWith('.js')) {
          try {
            const module = await import(`file://${fullPath}?t=${Date.now()}`);
            const plugin = module.default;

            if (plugin && plugin.command) {
              const commands = Array.isArray(plugin.command) ? plugin.command : [plugin.command];

              for (const cmd of commands) {
                this.plugins.set(cmd, { ...plugin, category, filePath: fullPath });
              }

              
            }
          } catch (error) {
            
          }
        }
      }
    }

    try {
      await loadDirectory.call(this, pluginsDir);
      AdvancedLogger.success(`📦 Total loaded plugins: ${this.plugins.size}`);
    } catch (error) {
      AdvancedLogger.error('Error loading plugins:', error);
    }
  }

  async start() {
    try {
      AdvancedLogger.info('Memulai bot...');

      const botInfo = await this.getMe();
      AdvancedLogger.success(`Bot connected: @${botInfo.username}`);

      await this.loadPlugins();

      this.running = true;
      await this.poll();

    } catch (error) {
      AdvancedLogger.error('Bot start error:', error);
      throw error;
    }
  }

  async poll() {
    while (this.running) {
      try {
        const updates = await this.getUpdates(this.offset, 100, 30);
        
        for (const update of updates) {
          this.offset = Math.max(this.offset, update.update_id + 1);
          await this.processUpdate(update);
        }
        
      } catch (error) {
        AdvancedLogger.error('Polling error:', error);
        await Utils.sleep(5000);
      }
    }
  }

  stop() {
    this.running = false;
    AdvancedLogger.info('Bot stopped');
  }
}

async function startBot() {
  try {
    if (!config.token || config.token === '' || config.token === 'YOUR_BOT_TOKEN_HERE') {
      AdvancedLogger.error('❌ Token bot tidak ditemukan!');
      AdvancedLogger.info('📝 Cara mendapatkan token:');
      AdvancedLogger.info('1. Buka @BotFather di Telegram');
      AdvancedLogger.info('2. Ketik /newbot dan ikuti instruksi');
      AdvancedLogger.info('3. Copy token yang diberikan');
      AdvancedLogger.info('4. Buka Secrets tab di Replit');
      AdvancedLogger.info('5. Tambah secret dengan key: BOT_TOKEN dan value: token dari BotFather');
      AdvancedLogger.info('6. Restart bot');
      process.exit(1);
    }

    global.db = new DatabaseManager();
    global.ai = new AdvancedAI(config);
    const bot = new TelegramBot(config.token);
    global.bot = bot;
    
    if (config.webhook.enabled) {
      global.webhook = new WebhookManager(bot, config);
    }

    process.on('SIGINT', async () => {
      AdvancedLogger.info('Mematikan bot...');
      bot.stop();
      await global.db.saveDatabase();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      AdvancedLogger.info('Mematikan bot...');
      bot.stop();
      await global.db.saveDatabase();
      process.exit(0);
    });

    process.on('uncaughtException', (error) => {
      AdvancedLogger.error('Uncaught Exception:', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      AdvancedLogger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    if (config.webhook.enabled) {
      await global.webhook.start();
      await global.webhook.setWebhook();
      AdvancedLogger.success('Bot berjalan dalam mode webhook');
    } else {
      await bot.start();
      AdvancedLogger.success('Bot berjalan dalam mode polling');
    }

    AdvancedLogger.success(`Bot ${global.namebot} berhasil dijalankan!`);
    AdvancedLogger.info(`Uptime dimulai pada: ${new Date().toLocaleString('id-ID')}`);

  } catch (error) {
    AdvancedLogger.error('Gagal memulai bot:', error);
    process.exit(1);
  }
}

startBot();
