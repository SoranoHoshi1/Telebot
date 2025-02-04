import { readdirSync, watch, existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import syntaxerror from 'syntax-error';

const reloadCooldown = new Map(); 
const pluginFolder = join(process.cwd(), './plugins');
const pluginFilter = (filename) => /\.js$/.test(filename);
global.plugins = new Map();

function getAllPluginFiles(dir) {
  let results = [];
  for (const fileOrDir of readdirSync(dir)) {
    const fullPath = join(dir, fileOrDir);
    if (statSync(fullPath).isDirectory()) {
      results = results.concat(getAllPluginFiles(fullPath));
    } else if (pluginFilter(fileOrDir)) {
      results.push(fullPath);
    }
  }
  return results;
}

export async function loadPlugins() {
  global.plugins.clear();
  const pluginFiles = getAllPluginFiles(pluginFolder);
  for (const filePath of pluginFiles) {
    await loadPlugin(filePath);
  }
  console.log(chalk.cyan(`${global.plugins.size} Plugins Loaded`));
}

async function loadPlugin(filePath) {
  try {
    const module = await import(`file://${filePath}?update=${Date.now()}`);

    if (!module.default || !module.default.command) {
      console.error(`❌ Plugin '${filePath}' tidak memiliki 'command'.`);
      return;
    }

    global.plugins.set(module.default.command, module.default);
  } catch (e) {
    console.error(`❌ Error loading plugin '${filePath}':`, e);
  }
}

export async function reloadPlugin(_event, filePath) {
  if (pluginFilter(filePath)) {
    if (existsSync(filePath)) {
      console.log(`🔄 Reloading plugin '${filePath}'`);
    } else {
      console.warn(`🗑 Plugin '${filePath}' deleted`);
      return;
    }

    const err = syntaxerror(readFileSync(filePath), filePath, {
      sourceType: 'module',
      allowAwaitOutsideFunction: true,
    });

    if (err) {
      console.error(`❌ Syntax error in plugin '${filePath}':\n`, err);
    } else {
      await loadPlugin(filePath);
    }
  }
}

function watchPlugins(dir) {
  watch(dir, { recursive: true }, (event, filename) => {
    if (filename) {
      const filePath = join(dir, filename);
      if (existsSync(filePath) && pluginFilter(filename)) {
        const now = Date.now();
        if (reloadCooldown.has(filePath) && now - reloadCooldown.get(filePath) < 500) {
          return;
        }
        reloadCooldown.set(filePath, now);
        reloadPlugin(event, filePath);
      }
    }
  });
}

watchPlugins(pluginFolder);