
export default {
  token: process.env.BOT_TOKEN || '7576717834:AAEhTfOt2foAYE4LJvEJSuAWEBn3To7QJY4',

  namebot: 'Ultimate Telegram Bot',

  owner: [
    ['1234567890', 'Owner Name'],
  ],

  premium: [
    '1234567890'
  ],

  database: {
    type: 'json',
    autoSave: true,
    saveInterval: 15000,
    backupEnabled: true,
    maxBackups: 10,
    compressionEnabled: true
  },

  security: {
    rateLimitEnabled: true,
    maxRequestsPerMinute: 50,
    antiSpam: true,
    antiFlood: true,
    blacklistedUsers: [],
    allowedDomains: ['telegram.org', 'github.com', 'replit.com'],
    contentFilter: true,
    autoModeration: true,
    malwareDetection: true
  },

  features: {
    economy: true,
    leveling: true,
    moderation: true,
    ai: true,
    downloader: true,
    games: true,
    nsfw: false,
    analytics: true,
    autoBackup: true,
    webDashboard: true,
    multiLanguage: true,
    customCommands: true,
    scheduling: true,
    webhooks: true
  },

  api: {
    openweather: process.env.OPENWEATHER_API || 'your_openweather_api_key',
    openai: process.env.OPENAI_API || 'your_openai_api_key',
    google: process.env.GOOGLE_API || 'your_google_api_key',
    youtube: process.env.YOUTUBE_API || 'your_youtube_api_key',
    deepai: process.env.DEEPAI_API || 'your_deepai_api_key',
    huggingface: process.env.HUGGINGFACE_API || 'your_huggingface_api_key',
    rapidapi: process.env.RAPIDAPI_KEY || 'your_rapidapi_key'
  },

  limits: {
    messageLength: 4000,
    fileSize: '100MB',
    downloadTimeout: 600000,
    requestTimeout: 45000,
    maxConcurrentRequests: 100,
    maxPluginsPerUser: 50,
    maxStoragePerUser: '500MB'
  },

  cache: {
    enabled: true,
    ttl: 3600000,
    maxSize: 5000,
    cleanupInterval: 300000,
    persistence: true
  },

  logs: {
    level: 'info',
    saveToFile: true,
    maxLogFiles: 20,
    rotateDaily: true,
    enableColors: true,
    includeStack: true,
    remoteLogging: false
  },

  performance: {
    monitorEnabled: true,
    alertThreshold: 3000,
    memoryLimit: '1GB',
    cpuThreshold: 80,
    enableProfiling: true,
    optimizations: true
  },

  webhook: {
    enabled: false,
    url: process.env.WEBHOOK_URL || '',
    port: process.env.PORT || 5000,
    path: '/webhook',
    maxConnections: 40
  },

  cluster: {
    enabled: false,
    workers: 'auto',
    maxRestarts: 5,
    gracefulShutdown: true
  },

  ai: {
    defaultModel: 'gpt-3.5-turbo',
    maxTokens: 2048,
    temperature: 0.7,
    enableContext: true,
    contextLength: 10,
    enablePersonality: true,
    moderationEnabled: true
  },

  media: {
    allowedTypes: ['photo', 'video', 'audio', 'document'],
    maxFileSize: '50MB',
    compressionEnabled: true,
    watermarkEnabled: false,
    virusScanEnabled: true
  },

  games: {
    enableLeaderboards: true,
    maxGamesPerUser: 5,
    enableTournaments: true,
    rewardSystem: true,
    antiCheat: true
  },

  economy: {
    startingMoney: 1000,
    dailyBonus: 500,
    maxDailyStreak: 30,
    interestRate: 0.05,
    enableBanking: true,
    enableStocks: true,
    enableCrypto: true
  }
};
