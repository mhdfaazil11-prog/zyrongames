/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const app = express();
app.use(express.json({ limit: '15mb' }));

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const GAMES_FILE = path.join(DATA_DIR, 'custom-games.json');
const ADMIN_CONFIG_FILE = path.join(DATA_DIR, 'admin-config.json');

// Default admin password: "8431126242"
// sha256 of "ng:8431126242" is "e6ab3ebb8285927d856e1ab5ed5e0bd8b0832d46573cbad768a66e2b84fba071"
const DEFAULT_PASSWORD = '8431126242';
const DEFAULT_PASSWORD_HASH = crypto.createHash('sha256').update('ng:' + DEFAULT_PASSWORD).digest('hex');

function getAdminConfig() {
  try {
    if (fs.existsSync(ADMIN_CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(ADMIN_CONFIG_FILE, 'utf8'));
    }
  } catch (err) {
    console.warn('Error reading admin config:', err);
  }
  return { passwordHash: DEFAULT_PASSWORD_HASH, plainPassword: DEFAULT_PASSWORD };
}

function saveAdminConfig(cfg: any) {
  fs.writeFileSync(ADMIN_CONFIG_FILE, JSON.stringify(cfg, null, 2));
}

// Initialize config if not existing
if (!fs.existsSync(ADMIN_CONFIG_FILE)) {
  saveAdminConfig({ passwordHash: DEFAULT_PASSWORD_HASH, plainPassword: DEFAULT_PASSWORD });
}

// Initialize games file if not existing
if (!fs.existsSync(GAMES_FILE)) {
  fs.writeFileSync(GAMES_FILE, JSON.stringify({ customGames: [], hiddenGames: [] }, null, 2));
}

// ----------------- API ENDPOINTS -----------------

// 1. Get shared custom games across all devices
app.get('/api/custom-games', (req, res) => {
  try {
    if (!fs.existsSync(GAMES_FILE)) {
      return res.json({ customGames: [], hiddenGames: [] });
    }
    const content = fs.readFileSync(GAMES_FILE, 'utf8');
    res.json(JSON.parse(content));
  } catch (err) {
    console.error('Failed to read custom games:', err);
    res.status(500).json({ error: 'Failed to read custom games' });
  }
});

// 2. Save custom games (called by admin, synced to all devices)
app.post('/api/custom-games', (req, res) => {
  try {
    const { customGames, hiddenGames } = req.body;
    const toSave = {
      customGames: Array.isArray(customGames) ? customGames : [],
      hiddenGames: Array.isArray(hiddenGames) ? hiddenGames : [],
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(GAMES_FILE, JSON.stringify(toSave, null, 2));
    console.log(`Saved ${toSave.customGames.length} custom games to persistent storage.`);
    res.json({ success: true, count: toSave.customGames.length });
  } catch (err) {
    console.error('Failed to save custom games:', err);
    res.status(500).json({ error: 'Failed to save custom games' });
  }
});

// 3. Admin hash check
app.get('/api/admin/hash', (req, res) => {
  const cfg = getAdminConfig();
  res.json({ hash: cfg.passwordHash || DEFAULT_PASSWORD_HASH });
});

// 4. Verify admin password
app.post('/api/admin/verify', (req, res) => {
  try {
    const { password, hash } = req.body;
    const cfg = getAdminConfig();
    const currentHash = cfg.passwordHash || DEFAULT_PASSWORD_HASH;

    let computedHash = '';
    if (password) {
      computedHash = crypto.createHash('sha256').update('ng:' + password).digest('hex');
    }

    const isMatch =
      (hash && hash === currentHash) ||
      (password && computedHash === currentHash) ||
      (password && password === DEFAULT_PASSWORD) ||
      (password && cfg.plainPassword && password === cfg.plainPassword);

    if (isMatch) {
      return res.json({ success: true, authorized: true, hash: currentHash });
    }

    res.status(401).json({ success: false, error: 'Incorrect password.' });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed.' });
  }
});

// 5. Change admin password
app.post('/api/admin/change-password', (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current password and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters.' });
    }

    const cfg = getAdminConfig();
    const currentHash = cfg.passwordHash || DEFAULT_PASSWORD_HASH;
    const verifyHash = crypto.createHash('sha256').update('ng:' + currentPassword).digest('hex');

    const isOldValid =
      verifyHash === currentHash ||
      currentPassword === DEFAULT_PASSWORD ||
      (cfg.plainPassword && currentPassword === cfg.plainPassword);

    if (!isOldValid) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect.' });
    }

    const newHash = crypto.createHash('sha256').update('ng:' + newPassword).digest('hex');
    cfg.passwordHash = newHash;
    cfg.plainPassword = newPassword;
    cfg.updatedAt = new Date().toISOString();
    saveAdminConfig(cfg);

    console.log('Admin password updated successfully.');
    res.json({ success: true, message: 'Password updated successfully across all devices!', hash: newHash });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password.' });
  }
});

// ----------------- VITE INTEGRATION -----------------
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Zyron server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
