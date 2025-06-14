
export default {
  command: ['facts', 'fakta', 'trivia'],
  tags: ['fun', 'info'],
  help: ['/facts', '/fakta', '/trivia'],
  description: 'Dapatkan fakta menarik random',
  async run(ctx) {
    try {
      const facts = [
        "🐙 Gurita memiliki 3 jantung dan darah berwarna biru!",
        "🍯 Madu tidak akan pernah basi jika disimpan dengan benar.",
        "🌕 Bulan menjauh dari Bumi sekitar 3,8 cm setiap tahunnya.",
        "🐧 Penguin memiliki lutut, tapi tersembunyi di dalam tubuh mereka.",
        "🧠 Otak manusia menggunakan sekitar 20% dari total energi tubuh.",
        "🌊 Laut mengandung sekitar 20 juta ton emas yang terlarut.",
        "🦒 Jerapah memiliki lidah sepanjang 45-50 cm berwarna biru kehitaman.",
        "⚡ Petir 5 kali lebih panas dari permukaan matahari.",
        "🐘 Gajah adalah satu-satunya mamalia yang tidak bisa melompat.",
        "🌮 Pisang secara teknis adalah berry, tapi stroberi bukan!",
        "🧊 Air panas bisa membeku lebih cepat dari air dingin (Efek Mpemba).",
        "🦆 Suara bebek tidak menghasilkan gema, tapi alasannya masih misterius.",
        "🌍 Bumi berputar dengan kecepatan 1.670 km/jam di khatulistiwa.",
        "🐝 Seekor lebah harus mengunjungi 2 juta bunga untuk membuat 450g madu.",
        "👁️ Mata manusia dapat membedakan sekitar 10 juta warna berbeda.",
        "🦈 Hiu lebih tua dari pohon! Hiu sudah ada 400 juta tahun yang lalu."
      ];

      const categories = [
        "🧬 Sains", "🌍 Alam", "🐾 Hewan", "🧠 Tubuh Manusia", 
        "🌌 Luar Angkasa", "🏛️ Sejarah", "🔬 Teknologi"
      ];

      const randomFact = facts[Math.floor(Math.random() * facts.length)];
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      
      const result = `
🤔 *Fakta Menarik Hari Ini*

${randomFact}

📚 *Kategori:* ${randomCategory}

💡 _Tahukah kamu? Kirim /facts lagi untuk fakta lainnya!_
      `.trim();

      ctx.reply(result, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Facts Error:', error);
      ctx.reply('⚠️ Gagal mendapatkan fakta. Coba lagi nanti.');
    }
  }
};
