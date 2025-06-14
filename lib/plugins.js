
import { readdirSync, watch, existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import syntaxerror from 'syntax-error';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pluginFolder = join(process.cwd(), './plugins');
const pluginFilter = (filename) => /\.js$/.test(filename);

global.plugins = new Map();
const reloadCooldown = new Map();
const pluginStats = new Map();
const reloadDelay = 300;
const enableHotReload = !process.env.DISABLE_HOT_RELOAD;

class PluginLogger {
  static log(level, msg, err) {
    const message = `[${new Date().toISOString()}] PLUGIN ${level}: ${msg}`;
    const colors = { INFO: 'blue', SUCCESS: 'green', WARN: 'yellow', ERROR: 'red' };
    console.log(chalk[colors[level]](message));
  }
  
  static info(msg) { this.log('INFO', msg); }
  static success(msg) { this.log('SUCCESS', msg); }
  static warn(msg) { this.log('WARN', msg); }
  static error(msg, err) { this.log('ERROR', msg, err); }
}

function validatePlugin(module, filePath) {
  if (!module.default) {
    PluginLogger.error(`Missing default export: ${filePath}`);
    return false;
  }
  
  const { command, tags, run, on, callbackPattern } = module.default;
  
  if (!command) {
    PluginLogger.error(`Missing command property: ${filePath}`);
    return false;
  }
  
  if (!run || typeof run !== 'function') {
    PluginLogger.error(`Invalid run function: ${filePath}`);
    return false;
  }
  
  if (!Array.isArray(tags)) {
    module.default.tags = ['misc'];
  }
  
  if (!Array.isArray(module.default.help) || module.default.help.length === 0) {
    module.default.help = Array.isArray(command) ? command.map(cmd => `/${cmd}`) : [`/${command}`];
  }
  
  if (on && !Array.isArray(on)) {
    module.default.on = [];
  }
  
  if (callbackPattern && !(callbackPattern instanceof RegExp || typeof callbackPattern === 'string')) {
    module.default.callbackPattern = null;
  }
  
  return true;
}

function getAllPluginFiles(dir) {
  let results = [];
  try {
    for (const fileOrDir of readdirSync(dir)) {
      const fullPath = join(dir, fileOrDir);
      if (statSync(fullPath).isDirectory()) {
        results = results.concat(getAllPluginFiles(fullPath));
      } else if (pluginFilter(fileOrDir)) {
        results.push(fullPath);
      }
    }
  } catch (e) {
    PluginLogger.error(`Directory read failed: ${dir}`, e);
  }
  return results;
}

function clearModuleCache(filePath) {
  const modulePath = `file://${filePath}`;
  if (require.cache[modulePath]) {
    delete require.cache[modulePath];
  }
}

async function loadPlugin(filePath) {
  try {
    const startTime = Date.now();
    clearModuleCache(filePath);
    
    const module = await import(`file://${filePath}?update=${Date.now()}`);
    if (!validatePlugin(module, filePath)) return;

    const { command } = module.default;
    const commands = Array.isArray(command) ? command : [command];

    global.plugins.set(filePath, module.default);
    
    const loadTime = Date.now() - startTime;
    pluginStats.set(filePath, {
      loadTime,
      lastLoaded: Date.now(),
      commands: commands.length
    });
    
    PluginLogger.success(`Loaded: ${filePath} (${commands.join(', ')}) in ${loadTime}ms`);
  } catch (e) {
    PluginLogger.error(`Load failed: ${filePath}`, e);
  }
}

export async function reloadPlugin(event, filePath) {
  if (!pluginFilter(filePath)) return;

  const fullPath = join(pluginFolder, filePath);
  const now = Date.now();
  
  if (reloadCooldown.has(fullPath) && now - reloadCooldown.get(fullPath) < reloadDelay) {
    return;
  }
  reloadCooldown.set(fullPath, now);

  if (!existsSync(fullPath)) {
    if (global.plugins.has(fullPath)) {
      global.plugins.delete(fullPath);
      pluginStats.delete(fullPath);
      PluginLogger.success(`Removed: ${fullPath}`);
    }
    return;
  }

  const err = syntaxerror(readFileSync(fullPath), fullPath, {
    sourceType: 'module',
    allowAwaitOutsideFunction: true,
  });

  if (err) {
    PluginLogger.error(`Syntax error: ${fullPath}`, err);
    return;
  }

  await loadPlugin(fullPath);
}

export async function loadPlugins() {
  const startTime = Date.now();
  global.plugins.clear();
  pluginStats.clear();
  
  const pluginFiles = getAllPluginFiles(pluginFolder);
  PluginLogger.info(`Found ${pluginFiles.length} plugin files`);
  
  const loadPromises = pluginFiles.map(loadPlugin);
  await Promise.allSettled(loadPromises);
  
  const totalLoadTime = Date.now() - startTime;
  PluginLogger.success(`Loaded ${global.plugins.size}/${pluginFiles.length} plugins in ${totalLoadTime}ms`);
}

export function getPluginStats() {
  return {
    total: global.plugins.size,
    stats: Object.fromEntries(pluginStats),
    totalCommands: Array.from(pluginStats.values()).reduce((sum, stat) => sum + stat.commands, 0),
    avgLoadTime: Array.from(pluginStats.values()).reduce((sum, stat) => sum + stat.loadTime, 0) / pluginStats.size || 0
  };
}

function watchPlugins(dir) {
  if (!enableHotReload) {
    PluginLogger.info('Hot-reload disabled');
    return;
  }
  
  watch(dir, { recursive: true }, (event, filename) => {
    if (filename) {
      const filePath = join(dir, filename);
      reloadPlugin(event, filePath);
    }
  });
  
  PluginLogger.info(`Watching: ${dir}`);
}

watchPlugins(pluginFolder);
