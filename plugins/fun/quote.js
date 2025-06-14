
export default {
  command: ['quote', 'quotes', 'motivasi'],
  tags: ['fun', 'quotes'],
  help: ['/quote', '/quotes', '/motivasi'],
  description: 'Dapatkan quote inspiratif random',
  async run(ctx) {
    try {
      const quotes = [
        "Kesuksesan adalah perjalanan, bukan tujuan. - Ben Sweetland",
        "Hidup adalah 10% apa yang terjadi padamu dan 90% bagaimana kamu meresponsnya. - Charles R. Swindoll",
        "Jangan menunggu kesempatan. Ciptakanlah kesempatan itu. - George Bernard Shaw",
        "Masa depan milik mereka yang percaya pada keindahan mimpi mereka. - Eleanor Roosevelt",
        "Satu-satunya cara untuk melakukan pekerjaan yang hebat adalah dengan mencintai apa yang kamu lakukan. - Steve Jobs",
        "Inovasi membedakan antara pemimpin dan pengikut. - Steve Jobs",
        "Kualitas bukanlah sebuah tindakan, tetapi sebuah kebiasaan. - Aristoteles",
        "Percayalah pada dirimu sendiri dan semua yang ada pada dirimu. - Christian D. Larson",
        "Jangan takut gagal. Takutlah tidak mencoba. - Unknown",
        "Kesuksesan dimulai dari kemauan untuk mencoba. - Unknown",
        "Mimpi besar dan berani untuk gagal. - Norman Vaughan",
        "Setiap pencapaian besar adalah hasil dari kerja keras. - Unknown"
      ];

      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      
      const result = `
💭 *Quote Inspiratif*

"${randomQuote}"

🌟 _Semoga menginspirasi hari Anda!_
      `.trim();

      ctx.reply(result, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Quote Error:', error);
      ctx.reply('⚠️ Gagal mendapatkan quote. Coba lagi nanti.');
    }
  }
};
