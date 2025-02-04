import { exec } from "child_process";

export default {
  command: "exec",
  description: "Jalankan perintah terminal di server",
  owner: true,
  async run(ctx) {
    const args = ctx.message.text.split(" ").slice(1);
    if (args.length === 0) return ctx.reply("⚠ Masukkan perintah yang ingin dijalankan.");

    const command = args.join(" ");

    exec(command, (error, stdout, stderr) => {
      if (error) {
        return ctx.reply(`❌ Error:\n\`\`\`\n${error.message}\n\`\`\``);
      }
      if (stderr) {
        return ctx.reply(`⚠ Stderr:\n\`\`\`\n${stderr}\n\`\`\``);
      }
      ctx.reply(`✅ Output:\n\`\`\`\n${stdout || "Perintah selesai tanpa output"}\n\`\`\``);
    });
  }
};