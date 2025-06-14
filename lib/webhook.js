
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

export class WebhookManager {
  constructor(bot, config) {
    this.bot = bot;
    this.config = config;
    this.app = express();
    this.server = null;
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    const limiter = rateLimit({
      windowMs: 60 * 1000,
      max: this.config.webhook.maxConnections || 40,
      message: { error: 'Rate limit exceeded' }
    });
    
    this.app.use(limiter);
  }

  setupRoutes() {
    this.app.post(this.config.webhook.path, async (req, res) => {
      try {
        const update = req.body;
        await this.bot.processUpdate(update);
        res.status(200).json({ ok: true });
      } catch (error) {
        global.log.error('Webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        uptime: global.performance.getUptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      });
    });

    this.app.get('/stats', (req, res) => {
      res.json({
        performance: global.performance.getMetrics(),
        database: global.db.getStats(),
        bot: {
          plugins: this.bot.plugins.size,
          uptime: global.performance.getUptime()
        }
      });
    });
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.config.webhook.port, '0.0.0.0', (err) => {
        if (err) {
          reject(err);
        } else {
          global.log.success(`Webhook server berjalan di port ${this.config.webhook.port}`);
          resolve();
        }
      });
    });
  }

  async setWebhook() {
    try {
      await this.bot.apiCall('setWebhook', {
        url: this.config.webhook.url + this.config.webhook.path,
        max_connections: this.config.webhook.maxConnections,
        allowed_updates: ['message', 'callback_query', 'inline_query']
      });
      global.log.success('Webhook berhasil diatur');
    } catch (error) {
      global.log.error('Gagal mengatur webhook:', error);
      throw error;
    }
  }

  async deleteWebhook() {
    try {
      await this.bot.apiCall('deleteWebhook');
      global.log.info('Webhook dihapus');
    } catch (error) {
      global.log.error('Gagal menghapus webhook:', error);
    }
  }

  stop() {
    if (this.server) {
      this.server.close();
      global.log.info('Webhook server dihentikan');
    }
  }
}

export default WebhookManager;
