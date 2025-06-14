
import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class DatabaseManager {
  constructor(config = {}) {
    this.config = {
      path: config.path || join(__dirname, '..', 'data'),
      autoSave: config.autoSave !== false,
      saveInterval: config.saveInterval || 30000,
      backupEnabled: config.backupEnabled !== false,
      maxBackups: config.maxBackups || 5,
      ...config
    };
    
    this.dbPath = join(this.config.path, 'database.json');
    this.backupPath = join(this.config.path, 'backups');
    this.data = this.loadDatabase();
    this.lastSave = Date.now();
    this.changed = false;
    
    if (this.config.autoSave) {
      this.saveInterval = setInterval(() => {
        if (this.changed) {
          this.saveDatabase();
        }
      }, this.config.saveInterval);
    }
    
    if (this.config.backupEnabled) {
      this.createBackup();
    }
  }

  loadDatabase() {
    try {
      if (!fs.existsSync(this.config.path)) {
        fs.mkdirSync(this.config.path, { recursive: true });
      }
      
      if (fs.existsSync(this.dbPath)) {
        const data = JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
        return {
          users: {},
          chats: {},
          settings: {},
          stats: {
            totalUsers: 0,
            totalChats: 0,
            totalCommands: 0,
            startTime: Date.now()
          },
          ...data
        };
      }
    } catch (error) {
      console.error('Database load error:', error);
      return this.getDefaultData();
    }
    
    return this.getDefaultData();
  }

  getDefaultData() {
    return {
      users: {},
      chats: {},
      settings: {
        version: '2.0.0',
        lastUpdate: Date.now()
      },
      stats: {
        totalUsers: 0,
        totalChats: 0,
        totalCommands: 0,
        startTime: Date.now()
      }
    };
  }

  saveDatabase() {
    try {
      if (!fs.existsSync(this.config.path)) {
        fs.mkdirSync(this.config.path, { recursive: true });
      }
      
      const tempPath = this.dbPath + '.tmp';
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2));
      fs.renameSync(tempPath, this.dbPath);
      
      this.lastSave = Date.now();
      this.changed = false;
      
      return true;
    } catch (error) {
      console.error('Database save error:', error);
      return false;
    }
  }

  createBackup() {
    try {
      if (!this.config.backupEnabled) return;
      
      if (!fs.existsSync(this.backupPath)) {
        fs.mkdirSync(this.backupPath, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = join(this.backupPath, `backup-${timestamp}.json`);
      
      if (fs.existsSync(this.dbPath)) {
        fs.copyFileSync(this.dbPath, backupFile);
      }
      
      this.cleanOldBackups();
    } catch (error) {
      console.error('Backup creation error:', error);
    }
  }

  cleanOldBackups() {
    try {
      const backups = fs.readdirSync(this.backupPath)
        .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: join(this.backupPath, file),
          time: fs.statSync(join(this.backupPath, file)).mtime
        }))
        .sort((a, b) => b.time - a.time);
      
      if (backups.length > this.config.maxBackups) {
        const toDelete = backups.slice(this.config.maxBackups);
        toDelete.forEach(backup => {
          fs.unlinkSync(backup.path);
        });
      }
    } catch (error) {
      console.error('Backup cleanup error:', error);
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
        totalCommands: 0,
        achievements: [],
        settings: {
          language: 'id',
          notifications: true,
          privacy: 'public'
        },
        stats: {
          messagesCount: 0,
          commandsUsed: 0,
          timeSpent: 0
        }
      };
      this.data.stats.totalUsers++;
      this.changed = true;
    }
    
    this.data.users[userId].lastSeen = Date.now();
    return this.data.users[userId];
  }

  updateUser(userId, updates) {
    const user = this.getUser(userId);
    Object.assign(user, updates);
    this.changed = true;
    return user;
  }

  getChat(chatId) {
    if (!this.data.chats[chatId]) {
      this.data.chats[chatId] = {
        id: chatId,
        joinDate: Date.now(),
        lastActivity: Date.now(),
        settings: {
          welcome: false,
          antiSpam: true,
          language: 'id',
          moderation: false
        },
        stats: {
          messages: 0,
          commands: 0,
          members: 0
        },
        rules: [],
        admins: [],
        banned: []
      };
      this.data.stats.totalChats++;
      this.changed = true;
    }
    
    this.data.chats[chatId].lastActivity = Date.now();
    return this.data.chats[chatId];
  }

  updateChat(chatId, updates) {
    const chat = this.getChat(chatId);
    Object.assign(chat, updates);
    this.changed = true;
    return chat;
  }

  getSetting(key, defaultValue = null) {
    return this.data.settings[key] ?? defaultValue;
  }

  setSetting(key, value) {
    this.data.settings[key] = value;
    this.changed = true;
    return value;
  }

  getStats() {
    return {
      ...this.data.stats,
      uptime: Date.now() - this.data.stats.startTime,
      lastSave: this.lastSave,
      databaseSize: this.getDatabaseSize()
    };
  }

  getDatabaseSize() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const stats = fs.statSync(this.dbPath);
        return stats.size;
      }
    } catch (error) {
      console.error('Error getting database size:', error);
    }
    return 0;
  }

  getAllUsers() {
    return Object.values(this.data.users);
  }

  getAllChats() {
    return Object.values(this.data.chats);
  }

  searchUsers(query) {
    const users = this.getAllUsers();
    return users.filter(user => 
      user.id.includes(query) || 
      (user.username && user.username.toLowerCase().includes(query.toLowerCase()))
    );
  }

  getTopUsers(limit = 10, sortBy = 'totalExp') {
    const users = this.getAllUsers();
    return users
      .sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0))
      .slice(0, limit);
  }

  deleteUser(userId) {
    if (this.data.users[userId]) {
      delete this.data.users[userId];
      this.data.stats.totalUsers--;
      this.changed = true;
      return true;
    }
    return false;
  }

  deleteChat(chatId) {
    if (this.data.chats[chatId]) {
      delete this.data.chats[chatId];
      this.data.stats.totalChats--;
      this.changed = true;
      return true;
    }
    return false;
  }

  cleanup() {
    const now = Date.now();
    const inactiveThreshold = 30 * 24 * 60 * 60 * 1000; // 30 hari
    
    let cleaned = 0;
    
    for (const [userId, user] of Object.entries(this.data.users)) {
      if (now - user.lastSeen > inactiveThreshold && user.totalCommands === 0) {
        delete this.data.users[userId];
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.data.stats.totalUsers -= cleaned;
      this.changed = true;
    }
    
    return cleaned;
  }

  export() {
    return JSON.stringify(this.data, null, 2);
  }

  import(jsonData) {
    try {
      const importedData = JSON.parse(jsonData);
      this.data = { ...this.getDefaultData(), ...importedData };
      this.changed = true;
      return true;
    } catch (error) {
      console.error('Import error:', error);
      return false;
    }
  }

  destroy() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }
    
    if (this.changed) {
      this.saveDatabase();
    }
  }
}

export default DatabaseManager;
