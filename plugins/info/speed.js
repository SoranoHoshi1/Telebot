import { cpus as _cpus, totalmem, freemem } from 'os';
import os from 'os';
import fs from 'fs';
import { performance } from 'perf_hooks';
import { sizeFormatter } from 'human-readable';

let format = sizeFormatter({
  std: 'JEDEC',
  decimalPlaces: 2,
  keepTrailingZeroes: false,
  render: (literal, symbol) => `${literal} ${symbol}B`,
});

const botStartTime = Date.now();

export default {
  command: "ping",
  description: "cek info bot",
  async run(ctx) {
    const start = performance.now();
    
    let muptime = clockString(Date.now() - botStartTime);
    
    let used = process.memoryUsage();
    let cpus = _cpus().map(cpu => {
      cpu.total = Object.keys(cpu.times).reduce((last, type) => last + cpu.times[type], 0);
      return cpu;
    });

    const cpu = cpus.reduce((last, cpu) => {
      last.total += cpu.total;
      last.speed += cpu.speed / cpus.length;
      last.times.user += cpu.times.user;
      last.times.nice += cpu.times.nice;
      last.times.sys += cpu.times.sys;
      last.times.idle += cpu.times.idle;
      last.times.irq += cpu.times.irq;
      return last;
    }, {
      speed: 0,
      total: 0,
      times: { user: 0, nice: 0, sys: 0, idle: 0, irq: 0 }
    });

    const end = performance.now();
    const speed = end - start;

    let runtt = `Speedp\n${Math.round(speed)} ms\nUptime\n${muptime}\n\nSystem Info\nRAM: ${format(totalmem() - freemem())} / ${format(totalmem())}\nFree RAM: ${format(freemem())}\nPlatform: ${os.platform()}\nServer: ${os.hostname()}\n\nNodeJS Memory Usage\n${Object.keys(used).map(key => `${key.padEnd(Math.max(...Object.keys(used).map(v => v.length)), ' ')}: ${format(used[key])}`).join('\n')}`;

    await ctx.reply(runtt);
  }
};

function clockString(ms) {
  let d = isNaN(ms) ? '--' : Math.floor(ms / 86400000);
  let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000) % 24;
  let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60;
  let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60;
  return [d, ' Days ☀️\n ', h, ' Hours 🕐\n ', m, ' Minute ⏰\n ', s, ' Second ⏱️ ']
    .map(v => v.toString().padStart(2, 0))
    .join('');
}