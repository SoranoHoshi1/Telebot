import { readdirSync, watch, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import syntaxerror from 'syntax-error';

const pluginFolder = join(process.cwd(), './plugins');
const pluginFilter = (filename) => /\.js$/.test(filename);
global.plugins = new Map();

export async function loadPlugins() {
  global.plugins.clear();
  for (let filename of readdirSync(pluginFolder).filter(pluginFilter)) {
    await loadPlugin(filename);
  }
  console.log('✅ Plugins loaded:', [...global.plugins.keys()]);
}

async function loadPlugin(filename) {
  try {
    const filePath = join(pluginFolder, filename);
    const module = await import(`file://${filePath}?update=${Date.now()}`);

    if (!module.default || !module.default.command) {
      console.error(`❌ Plugin '${filename}' tidak memiliki 'command'.`);
      return;
    }

    global.plugins.set(module.default.command, module.default);
  } catch (e) {
    console.error(`❌ Error loading plugin '${filename}':`, e);
  }
}

export async function reloadPlugin(_event, filename) {
  if (pluginFilter(filename)) {
    const filePath = join(pluginFolder, filename);
    if (existsSync(filePath)) {
      console.log(`🔄 Reloading plugin '${filename}'`);
    } else {
      console.warn(`🗑 Plugin '${filename}' deleted`);
      return;
    }

    const err = syntaxerror(readFileSync(filePath), filename, {
      sourceType: 'module',
      allowAwaitOutsideFunction: true,
    });

    if (err) {
      console.error(`❌ Syntax error in plugin '${filename}':\n`, err);
    } else {
      await loadPlugin(filename);
    }
  }
}

watch(pluginFolder, reloadPlugin);