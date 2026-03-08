import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { exec, spawn } from 'child_process';
import util from 'util';
import crypto from 'crypto';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const AdmZip = require('adm-zip');

const execPromise = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Encrypted ZIP credentials helpers ---

function getCredentialsPath() {
  return path.join(app.getPath('userData'), 'credentials.vibe');
}

function deriveKey(pin) {
  const salt = 'vibe-blocking-ide-salt';
  return crypto.pbkdf2Sync(pin, salt, 100000, 32, 'sha256');
}

function encryptBuffer(buffer, pin) {
  const key = deriveKey(pin);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]);
}

function decryptBuffer(encryptedData, pin) {
  const key = deriveKey(pin);
  const iv = encryptedData.subarray(0, 16);
  const authTag = encryptedData.subarray(16, 32);
  const data = encryptedData.subarray(32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#4A3A31',
      symbolColor: '#FDFBF7',
      height: 32
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Window controls IPC
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow?.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on('window-close', () => mainWindow?.close());

// File System IPC
function isScaffoldCommandAllowed(cmd) {
  const c = (cmd || '').trim().toLowerCase();
  if (!c) return false;
  const allowed = [
    /^npm\s+create\b/,
    /^npx\s+create\b/,
    /^npx\s+create-/,
    /^mkdir\b/,
  ];
  return allowed.some((r) => r.test(c));
}

ipcMain.handle('save-project', async (event, { projectName, appType, vibeBlocks, generatedFiles, projectStructure, scaffoldCommand }) => {
  try {
    const defaultDrive = app.getPath('documents');
    const projectDir = path.join(defaultDrive, 'VibeApps', projectName || 'UntitledApp');

    await fs.mkdir(projectDir, { recursive: true });

    if (scaffoldCommand && isScaffoldCommandAllowed(scaffoldCommand)) {
      try {
        const parts = scaffoldCommand.trim().split(/\s+/);
        if (parts[0].toLowerCase() === 'mkdir') {
          const dashP = parts[1] === '-p';
          const dirs = dashP ? parts.slice(2) : parts.slice(1);
          for (const d of dirs) {
            if (d) {
              const full = path.join(projectDir, d.replace(/\//g, path.sep));
              await fs.mkdir(full, { recursive: true });
            }
          }
        } else {
          await execPromise(scaffoldCommand, { cwd: projectDir, timeout: 120000, shell: true });
        }
      } catch (scaffoldErr) {
        console.warn('Scaffold command failed:', scaffoldErr.message);
      }
    }

    await fs.writeFile(
      path.join(projectDir, 'vibe-config.json'),
      JSON.stringify({ appType, vibeBlocks, projectStructure }, null, 2)
    );

    if (generatedFiles && Array.isArray(generatedFiles)) {
      for (const file of generatedFiles) {
        if (file.filename && file.content) {
          const filePath = path.join(projectDir, file.filename);
          const fileDir = path.dirname(filePath);
          await fs.mkdir(fileDir, { recursive: true });
          await fs.writeFile(filePath, file.content, 'utf8');
        }
      }

      const versionsDir = path.join(projectDir, '.vibe-versions');
      await fs.mkdir(versionsDir, { recursive: true });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const versionDir = path.join(versionsDir, timestamp);
      await fs.mkdir(versionDir, { recursive: true });

      for (const file of generatedFiles) {
        if (file.filename && file.content) {
          const vPath = path.join(versionDir, file.filename);
          await fs.mkdir(path.dirname(vPath), { recursive: true });
          await fs.writeFile(vPath, file.content, 'utf8');
        }
      }

      await fs.writeFile(
        path.join(versionDir, '.vibe-meta.json'),
        JSON.stringify({
          timestamp: new Date().toISOString(),
          appType,
          files: generatedFiles.map(f => f.filename)
        }, null, 2)
      );
    }

    return { success: true, path: projectDir };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('load-project', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Load Vibe Project',
      defaultPath: path.join(app.getPath('documents'), 'VibeApps'),
      properties: ['openDirectory']
    });

    if (canceled || filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const projectDir = filePaths[0];
    const projectName = path.basename(projectDir);
    const configPath = path.join(projectDir, 'vibe-config.json');

    const fileContent = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(fileContent);

    return {
      success: true,
      data: {
        path: projectDir,
        projectName,
        appType: config.appType,
        vibeBlocks: config.vibeBlocks,
        projectStructure: config.projectStructure
      }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Browse and read files for Project Structure "feed" feature
ipcMain.handle('browse-files-for-structure', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Select files to feed into project structure',
      defaultPath: app.getPath('documents'),
      properties: ['openFile', 'multiSelections']
    });
    if (canceled || filePaths.length === 0) {
      return { success: false, canceled: true };
    }
    const results = [];
    for (const fp of filePaths) {
      const content = await fs.readFile(fp, 'utf8');
      const suggestedPath = path.basename(fp);
      results.push({ content, suggestedPath, sourcePath: fp });
    }
    return { success: true, files: results };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Run external tool IPC (cross-platform)
ipcMain.handle('launch-app', async (_event, launchPath) => {
  try {
    const errMsg = await shell.openPath(launchPath);
    if (errMsg) return { success: false, error: errMsg };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// --- Project API Keys ---

const PROJECT_KEY_PLACEHOLDER = /__VIBE_KEY_([A-Z0-9_]+)__/g;
const PROJECT_KEYS_FILE = '.vibe-keys';

function getProjectKeysPath(projectDir) {
  return path.join(projectDir, PROJECT_KEYS_FILE);
}

function encryptProjectKeys(keysObj) {
  const json = JSON.stringify(keysObj);
  const key = crypto.scryptSync(app.getPath('userData'), 'vibe-project-keys-salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

function decryptProjectKeys(base64) {
  const buf = Buffer.from(base64, 'base64');
  const key = crypto.scryptSync(app.getPath('userData'), 'vibe-project-keys-salt', 32);
  const iv = buf.subarray(0, 16);
  const authTag = buf.subarray(16, 32);
  const data = buf.subarray(32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}

ipcMain.handle('detect-project-keys', async (_event, { projectPath }) => {
  try {
    const keyNames = new Set();
    const files = await fs.readdir(projectPath);
    for (const file of files) {
      const filePath = path.join(projectPath, file);
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) continue;
      if (/\.(html|css|js|ts|jsx|tsx|json|env|py|rb|java|go|rs|toml|yaml|yml|xml|cfg|ini|sh|bat|ps1)$/i.test(file) || file === '.env') {
        const content = await fs.readFile(filePath, 'utf8');
        let m;
        const regex = new RegExp(PROJECT_KEY_PLACEHOLDER.source, 'g');
        while ((m = regex.exec(content)) !== null) {
          keyNames.add(m[1]);
        }
      }
    }
    return { success: true, keys: [...keyNames] };
  } catch (err) {
    return { success: false, error: err.message, keys: [] };
  }
});

ipcMain.handle('save-project-keys', async (_event, { projectPath, keys }) => {
  try {
    const encrypted = encryptProjectKeys(keys);
    await fs.writeFile(getProjectKeysPath(projectPath), encrypted, 'utf8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('load-project-keys', async (_event, { projectPath }) => {
  try {
    const data = await fs.readFile(getProjectKeysPath(projectPath), 'utf8');
    const keys = decryptProjectKeys(data);
    return { success: true, keys };
  } catch {
    return { success: true, keys: {} };
  }
});

ipcMain.handle('inject-project-keys', async (_event, { projectPath, keys }) => {
  try {
    const files = await fs.readdir(projectPath);
    let injected = 0;
    for (const file of files) {
      const filePath = path.join(projectPath, file);
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) continue;
      if (/\.(html|css|js|ts|jsx|tsx|json|env|py|rb|java|go|rs|toml|yaml|yml|xml|cfg|ini|sh|bat|ps1)$/i.test(file) || file === '.env') {
        let content = await fs.readFile(filePath, 'utf8');
        let changed = false;
        for (const [keyName, keyValue] of Object.entries(keys)) {
          const placeholder = `__VIBE_KEY_${keyName}__`;
          if (content.includes(placeholder)) {
            content = content.split(placeholder).join(keyValue);
            changed = true;
            injected++;
          }
        }
        if (changed) {
          await fs.writeFile(filePath, content, 'utf8');
        }
      }
    }
    return { success: true, injected };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// --- Encrypted ZIP credentials IPC ---

ipcMain.handle('has-credentials', async () => {
  try {
    await fs.access(getCredentialsPath());
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('save-credentials', async (_event, { apiKey, model, pin }) => {
  try {
    const envContent = `GEMINI_API_KEY=${apiKey}\nGEMINI_MODEL=${model}\n`;
    const zip = new AdmZip();
    zip.addFile('.env', Buffer.from(envContent, 'utf8'));
    const zipBuffer = zip.toBuffer();
    const encrypted = encryptBuffer(zipBuffer, pin);
    await fs.writeFile(getCredentialsPath(), encrypted);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('load-credentials', async (_event, pin) => {
  try {
    const encrypted = await fs.readFile(getCredentialsPath());
    const zipBuffer = decryptBuffer(encrypted, pin);
    const zip = new AdmZip(zipBuffer);
    const envEntry = zip.getEntry('.env');
    if (!envEntry) return { success: false, error: 'No .env found in archive.' };
    const envContent = envEntry.getData().toString('utf8');
    const parsed = {};
    for (const line of envContent.split('\n')) {
      const idx = line.indexOf('=');
      if (idx > 0) parsed[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
    }
    return {
      success: true,
      data: {
        apiKey: parsed.GEMINI_API_KEY || '',
        model: parsed.GEMINI_MODEL || 'gemini-1.5-pro'
      }
    };
  } catch {
    return { success: false, error: 'Invalid PIN or corrupted credentials file.' };
  }
});

ipcMain.handle('update-pin', async (_event, { oldPin, newPin }) => {
  try {
    const encrypted = await fs.readFile(getCredentialsPath());
    const zipBuffer = decryptBuffer(encrypted, oldPin);
    const reEncrypted = encryptBuffer(zipBuffer, newPin);
    await fs.writeFile(getCredentialsPath(), reEncrypted);
    return { success: true };
  } catch {
    return { success: false, error: 'Current PIN is incorrect.' };
  }
});

// --- MCP Server Management ---

function getMcpDir() {
  return path.join(app.getPath('userData'), 'mcp-servers');
}

function getMcpConfigPath() {
  return path.join(app.getPath('userData'), 'mcp-servers.json');
}

async function readMcpConfig() {
  try {
    const raw = await fs.readFile(getMcpConfigPath(), 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeMcpConfig(servers) {
  await fs.writeFile(getMcpConfigPath(), JSON.stringify(servers, null, 2));
}

ipcMain.handle('mcp-list', async () => {
  return { success: true, servers: await readMcpConfig() };
});

ipcMain.handle('mcp-build', async (_event, { name, files }) => {
  try {
    const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
    const serverDir = path.join(getMcpDir(), safeName);
    await fs.mkdir(serverDir, { recursive: true });

    for (const file of files) {
      const filePath = path.join(serverDir, file.filename);
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, file.content, 'utf8');
    }

    mainWindow?.webContents.send('mcp-install-log', { id: safeName, msg: 'Installing dependencies...' });
    await execPromise('npm install', { cwd: serverDir, timeout: 120000 });
    mainWindow?.webContents.send('mcp-install-log', { id: safeName, msg: 'Dependencies installed.' });

    const entry = {
      id: safeName,
      name,
      type: 'built',
      path: serverDir,
      command: 'node index.js',
      status: 'installed',
      createdAt: new Date().toISOString()
    };

    const servers = await readMcpConfig();
    const idx = servers.findIndex(s => s.id === safeName);
    if (idx >= 0) servers[idx] = entry; else servers.push(entry);
    await writeMcpConfig(servers);

    return { success: true, server: entry };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('mcp-add-custom', async (_event, { source }) => {
  try {
    const mcpDir = getMcpDir();
    await fs.mkdir(mcpDir, { recursive: true });

    let serverDir, serverName, command;

    if (source.startsWith('npm:')) {
      const pkg = source.slice(4).trim();
      serverName = pkg.split('/').pop().replace(/^server-/, '');
      const safeName = serverName.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
      serverDir = path.join(mcpDir, safeName);
      await fs.mkdir(serverDir, { recursive: true });

      const pkgJson = { name: `mcp-custom-${safeName}`, version: '1.0.0', private: true, dependencies: { [pkg]: 'latest' } };
      await fs.writeFile(path.join(serverDir, 'package.json'), JSON.stringify(pkgJson, null, 2));

      mainWindow?.webContents.send('mcp-install-log', { id: safeName, msg: `Installing ${pkg}...` });
      await execPromise('npm install', { cwd: serverDir, timeout: 120000 });
      mainWindow?.webContents.send('mcp-install-log', { id: safeName, msg: 'Installed.' });

      command = `npx ${pkg}`;
    } else {
      const stat = await fs.stat(source);
      if (!stat.isDirectory()) throw new Error('Path is not a directory.');
      serverDir = source;
      serverName = path.basename(source);

      try {
        const pkgRaw = await fs.readFile(path.join(source, 'package.json'), 'utf8');
        const pkg = JSON.parse(pkgRaw);
        serverName = pkg.name || serverName;
        if (pkg.dependencies && Object.keys(pkg.dependencies).length > 0) {
          mainWindow?.webContents.send('mcp-install-log', { id: serverName, msg: 'Installing dependencies...' });
          await execPromise('npm install', { cwd: source, timeout: 120000 });
          mainWindow?.webContents.send('mcp-install-log', { id: serverName, msg: 'Installed.' });
        }
      } catch { /* no package.json, that's ok */ }

      command = 'node index.js';
    }

    const safeName = serverName.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
    const entry = {
      id: safeName,
      name: serverName,
      type: 'custom',
      path: serverDir,
      command,
      source,
      status: 'installed',
      createdAt: new Date().toISOString()
    };

    const servers = await readMcpConfig();
    const idx = servers.findIndex(s => s.id === safeName);
    if (idx >= 0) servers[idx] = entry; else servers.push(entry);
    await writeMcpConfig(servers);

    return { success: true, server: entry };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('mcp-remove', async (_event, id) => {
  try {
    const servers = await readMcpConfig();
    const server = servers.find(s => s.id === id);
    if (server && server.type === 'built') {
      await fs.rm(server.path, { recursive: true, force: true });
    }
    await writeMcpConfig(servers.filter(s => s.id !== id));
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('mcp-browse-folder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Select MCP Server Folder',
    properties: ['openDirectory']
  });
  if (canceled || filePaths.length === 0) return { canceled: true };
  return { canceled: false, path: filePaths[0] };
});

// --- Skills Management ---

function getSkillsDir() {
  return path.join(app.getPath('userData'), 'skills');
}

function getSkillsConfigPath() {
  return path.join(app.getPath('userData'), 'skills.json');
}

async function readSkillsConfig() {
  try {
    const raw = await fs.readFile(getSkillsConfigPath(), 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeSkillsConfig(skills) {
  await fs.writeFile(getSkillsConfigPath(), JSON.stringify(skills, null, 2));
}

function parseSkillMd(content) {
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  const meta = { name: '', description: '' };
  if (frontmatterMatch) {
    const fm = frontmatterMatch[1];
    const nameMatch = fm.match(/^name:\s*(.+)$/m);
    const descMatch = fm.match(/^description:\s*(.+)$/m);
    if (nameMatch) meta.name = nameMatch[1].trim();
    if (descMatch) meta.description = descMatch[1].trim();
  }
  return meta;
}

async function scanForSkills(dir) {
  const found = [];
  async function walk(d) {
    try {
      const entries = await fs.readdir(d, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        const full = path.join(d, entry.name);
        if (entry.isDirectory()) {
          await walk(full);
        } else if (entry.name === 'SKILL.md') {
          const content = await fs.readFile(full, 'utf8');
          const meta = parseSkillMd(content);
          found.push({ dir: path.dirname(full), ...meta, content });
        }
      }
    } catch { /* skip unreadable dirs */ }
  }
  await walk(dir);
  return found;
}

ipcMain.handle('skills-list', async () => {
  return { success: true, skills: await readSkillsConfig() };
});

ipcMain.handle('skill-add-github', async (_event, repoUrl) => {
  try {
    const skillsDir = getSkillsDir();
    await fs.mkdir(skillsDir, { recursive: true });

    let cleanUrl = repoUrl.trim().replace(/\/$/, '');
    if (!cleanUrl.includes('://')) cleanUrl = 'https://github.com/' + cleanUrl;

    const repoName = cleanUrl.split('/').filter(Boolean).slice(-2).join('-').replace('.git', '');
    const cloneDir = path.join(skillsDir, repoName);

    try { await fs.rm(cloneDir, { recursive: true, force: true }); } catch {}

    mainWindow?.webContents.send('skill-log', `Cloning ${cleanUrl}...`);
    await execPromise(`git clone --depth 1 "${cleanUrl}" "${cloneDir}"`, { timeout: 60000 });

    const foundSkills = await scanForSkills(cloneDir);
    if (foundSkills.length === 0) {
      return { success: false, error: 'No SKILL.md files found in this repository.' };
    }

    const existing = await readSkillsConfig();
    const added = [];

    for (const sk of foundSkills) {
      const id = (sk.name || path.basename(sk.dir)).replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
      const entry = {
        id,
        name: sk.name || path.basename(sk.dir),
        description: sk.description || '',
        path: sk.dir,
        source: cleanUrl,
        type: 'github',
        createdAt: new Date().toISOString()
      };
      const idx = existing.findIndex(s => s.id === id);
      if (idx >= 0) existing[idx] = entry; else existing.push(entry);
      added.push(entry);
    }

    await writeSkillsConfig(existing);
    mainWindow?.webContents.send('skill-log', `Imported ${added.length} skill(s).`);
    return { success: true, added };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('skill-add-local', async (_event, folderPath) => {
  try {
    const foundSkills = await scanForSkills(folderPath);
    if (foundSkills.length === 0) {
      return { success: false, error: 'No SKILL.md found in this folder.' };
    }

    const existing = await readSkillsConfig();
    const added = [];

    for (const sk of foundSkills) {
      const id = (sk.name || path.basename(sk.dir)).replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
      const entry = {
        id,
        name: sk.name || path.basename(sk.dir),
        description: sk.description || '',
        path: sk.dir,
        source: folderPath,
        type: 'local',
        createdAt: new Date().toISOString()
      };
      const idx = existing.findIndex(s => s.id === id);
      if (idx >= 0) existing[idx] = entry; else existing.push(entry);
      added.push(entry);
    }

    await writeSkillsConfig(existing);
    return { success: true, added };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('skill-build', async (_event, { name, description, content }) => {
  try {
    const skillsDir = getSkillsDir();
    const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
    const skillDir = path.join(skillsDir, safeName);
    await fs.mkdir(skillDir, { recursive: true });

    await fs.writeFile(path.join(skillDir, 'SKILL.md'), content, 'utf8');

    const entry = {
      id: safeName,
      name,
      description,
      path: skillDir,
      type: 'built',
      createdAt: new Date().toISOString()
    };

    const existing = await readSkillsConfig();
    const idx = existing.findIndex(s => s.id === safeName);
    if (idx >= 0) existing[idx] = entry; else existing.push(entry);
    await writeSkillsConfig(existing);

    return { success: true, skill: entry };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('skill-remove', async (_event, id) => {
  try {
    const skills = await readSkillsConfig();
    const skill = skills.find(s => s.id === id);
    if (skill && skill.type === 'built') {
      await fs.rm(skill.path, { recursive: true, force: true });
    }
    await writeSkillsConfig(skills.filter(s => s.id !== id));
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('skill-read', async (_event, id) => {
  try {
    const skills = await readSkillsConfig();
    const skill = skills.find(s => s.id === id);
    if (!skill) return { success: false, error: 'Skill not found.' };
    const content = await fs.readFile(path.join(skill.path, 'SKILL.md'), 'utf8');
    return { success: true, content };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('skill-browse-folder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Skill Folder (containing SKILL.md)',
    properties: ['openDirectory']
  });
  if (canceled || filePaths.length === 0) return { canceled: true };
  return { canceled: false, path: filePaths[0] };
});

// --- Version History ---

ipcMain.handle('list-versions', async (_event, projectPath) => {
  try {
    const versionsDir = path.join(projectPath, '.vibe-versions');
    const entries = await fs.readdir(versionsDir, { withFileTypes: true });
    const versions = [];
    for (const entry of entries.filter(e => e.isDirectory())) {
      try {
        const meta = JSON.parse(await fs.readFile(path.join(versionsDir, entry.name, '.vibe-meta.json'), 'utf8'));
        versions.push({ id: entry.name, ...meta });
      } catch {
        versions.push({ id: entry.name, timestamp: entry.name });
      }
    }
    versions.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return { success: true, versions };
  } catch {
    return { success: true, versions: [] };
  }
});

ipcMain.handle('restore-version', async (_event, { projectPath, versionId }) => {
  try {
    const versionDir = path.join(projectPath, '.vibe-versions', versionId);
    const meta = JSON.parse(await fs.readFile(path.join(versionDir, '.vibe-meta.json'), 'utf8'));
    for (const filename of (meta.files || [])) {
      const src = path.join(versionDir, filename);
      const dest = path.join(projectPath, filename);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.copyFile(src, dest);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// --- Preview / File Reading ---

ipcMain.handle('read-project-files', async (_event, projectPath) => {
  try {
    const files = {};
    async function readDir(dir, prefix = '') {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (['.vibe-versions', 'vibe-config.json', 'node_modules', '.git'].includes(entry.name)) continue;
        const full = path.join(dir, entry.name);
        const rel = prefix ? prefix + '/' + entry.name : entry.name;
        if (entry.isDirectory()) {
          await readDir(full, rel);
        } else {
          files[rel] = await fs.readFile(full, 'utf8');
        }
      }
    }
    await readDir(projectPath);
    return { success: true, files };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// --- Read all skills content (for build pipeline) ---

ipcMain.handle('read-all-skills', async () => {
  try {
    const skills = await readSkillsConfig();
    const result = [];
    for (const skill of skills) {
      try {
        const content = await fs.readFile(path.join(skill.path, 'SKILL.md'), 'utf8');
        result.push({ name: skill.name, description: skill.description, content });
      } catch { /* skip unreadable */ }
    }
    return { success: true, skills: result };
  } catch {
    return { success: true, skills: [] };
  }
});

// --- Invoke MCP tool (for structured tool-calling during build) ---

ipcMain.handle('invoke-mcp-tool', async (_event, { serverPath, serverCommand, toolName, args }) => {
  return new Promise((resolve) => {
    const parts = serverCommand.replace(/\s+/g, ' ').trim().split(' ');
    const cmd = parts[0];
    const cmdArgs = parts.slice(1);
    const proc = spawn(cmd, cmdArgs.length ? cmdArgs : [], {
      cwd: serverPath,
      shell: process.platform === 'win32',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let buffer = '';
    let initialized = false;
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        proc.kill('SIGTERM');
        resolve({ success: false, error: 'MCP tool call timed out (30s)' });
      }
    }, 30000);

    const finish = (result) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        proc.kill('SIGTERM');
        resolve(result);
      }
    };

    proc.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
          if (msg.id === 1 && msg.result) {
            initialized = true;
            const initNotif = JSON.stringify({
              jsonrpc: '2.0',
              method: 'notifications/initialized'
            }) + '\n';
            proc.stdin.write(initNotif);
            const callReq = JSON.stringify({
              jsonrpc: '2.0',
              id: 2,
              method: 'tools/call',
              params: { name: toolName, arguments: args || {} }
            }) + '\n';
            proc.stdin.write(callReq);
            continue;
          }
          if (msg.id === 2) {
            if (msg.result) {
              const content = msg.result.content;
              const text = Array.isArray(content)
                ? content.map((c) => (c.type === 'text' ? c.text : '')).join('')
                : String(msg.result);
              finish({ success: true, result: text });
            } else if (msg.error) {
              finish({ success: false, error: msg.error.message || JSON.stringify(msg.error) });
            }
            return;
          }
          if (msg.error) {
            finish({ success: false, error: msg.error.message || JSON.stringify(msg.error) });
            return;
          }
        } catch {}
      }
    });

    proc.stderr.on('data', () => {});
    proc.on('error', (err) => finish({ success: false, error: err.message }));

    const initReq = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'vibe-blocking-ide', version: '0.0.0' }
      }
    }) + '\n';
    proc.stdin.write(initReq);
  });
});

// --- Read MCP server tool details (for build pipeline) ---

ipcMain.handle('read-mcp-details', async () => {
  try {
    const servers = await readMcpConfig();
    const result = [];
    for (const srv of servers) {
      if (srv.status !== 'installed') continue;
      const detail = { name: srv.name, path: srv.path, command: srv.command, description: '', tools: '', source: '' };

      try {
        const pkgPath = path.join(srv.path, 'package.json');
        const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
        detail.description = pkg.description || '';
      } catch { /* no package.json */ }

      const sourceFiles = ['index.js', 'index.mjs', 'index.cjs', 'src/index.js', 'server.js'];
      for (const sf of sourceFiles) {
        try {
          const content = await fs.readFile(path.join(srv.path, sf), 'utf8');
          detail.source = content;
          break;
        } catch { /* try next */ }
      }

      if (detail.source) {
        const toolNames = [];
        const toolRegex = /(?:name:\s*["'`]([^"'`]+)["'`]|addTool\s*\(\s*["'`]([^"'`]+)["'`]|tool\s*\(\s*["'`]([^"'`]+)["'`])/g;
        let m;
        while ((m = toolRegex.exec(detail.source)) !== null) {
          const found = m[1] || m[2] || m[3];
          if (found && !toolNames.includes(found)) toolNames.push(found);
        }

        const descRegex = /description:\s*["'`]([^"'`]+)["'`]/g;
        const descriptions = [];
        while ((m = descRegex.exec(detail.source)) !== null) {
          descriptions.push(m[1]);
        }

        if (toolNames.length > 0) {
          detail.tools = toolNames.map((t, i) => {
            const desc = descriptions[i] || '';
            return desc ? `${t}: ${desc}` : t;
          }).join('\n');
        }
      }

      result.push({ name: detail.name, path: detail.path, command: detail.command, description: detail.description, tools: detail.tools });
    }
    return { success: true, servers: result };
  } catch {
    return { success: true, servers: [] };
  }
});
