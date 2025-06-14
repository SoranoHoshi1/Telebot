
# 🤖 Ultimate Telegram Bot

Bot Telegram canggih dengan fitur lengkap yang dibangun tanpa dependency eksternal.

## 🚀 Quick Setup

### 1. Dapatkan Token Bot
1. Buka [@BotFather](https://t.me/BotFather) di Telegram
2. Ketik `/newbot` dan ikuti instruksi
3. Copy token yang diberikan (format: `1234567890:ABCDEFghijklmnopqrstuvwxyz`)

### 2. Setup di Replit
1. Buka tab **Secrets** di Replit
2. Tambah secret baru:
   - Key: `BOT_TOKEN`
   - Value: token dari BotFather
3. Klik tombol **Run**

### 3. Test Bot
- Kirim `/start` ke bot Anda di Telegram
- Bot akan merespons jika setup berhasil

## ✨ Fitur Utama

- 🧠 **AI Integration** - Chat dengan AI, generate gambar
- 💰 **Economy System** - Balance, daily bonus, transfer uang
- 🎮 **Games** - Casino, slots, tictactoe
- 📊 **Leveling** - System XP dan ranking
- 🛡️ **Moderation** - Admin tools untuk grup
- 🔧 **Tools** - Calculator, QR code, translate, weather
- 📱 **Dashboard** - Web interface untuk monitoring
- ⚡ **Performance** - Built-in monitoring dan logging

## 📁 Struktur Plugin

```
plugins/
├── Ai/           # AI features
├── admin/        # Admin tools
├── economy/      # Economy system
├── games/        # Games
├── info/         # Bot information
├── tools/        # Utility tools
└── owner/        # Owner-only commands
```

## 🔧 Konfigurasi

Edit `config.js` untuk menyesuaikan:
- API keys untuk berbagai service
- Fitur yang ingin diaktifkan
- Rate limiting dan security
- Economy settings

## 📝 Menambah Plugin

Buat file `.js` di folder `plugins/kategori/`:

```javascript
export default {
  command: "nama_command",
  tags: ['kategori'],
  help: ['/nama_command [parameter]'],
  description: "deskripsi command",
  async run(ctx) {
    await ctx.reply("Response bot");
  }
};
```

## 🚀 Deploy Production

1. Set environment variables yang diperlukan
2. Enable webhook mode di config
3. Deploy menggunakan Replit Deployments

## 🛠️ Development

- Logs tersimpan di `data/logs.json`
- Database JSON di `data/database.json`
- Auto-reload plugins tanpa restart bot
- Built-in performance monitoring

## 📞 Support

Jika mengalami masalah:
1. Check logs di console atau `data/logs.json`
2. Pastikan token bot benar
3. Periksa permissions bot di grup
