/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LeaderboardEntry {
  gameId: string;
  userId: string;
  displayName: string;
  photoURL?: string;
  score: number;
  submittedAt: string;
}

// Realistic initial community high scores for each game
const SEED_PLAYERS = [
  { name: 'Valkyrie99', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Valkyrie' },
  { name: 'CyberDrifter', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberDrift' },
  { name: 'NeonPhantom', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=NeonPhantom' },
  { name: 'ShadowStrike', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ShadowStrike' },
  { name: 'PixelLord', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=PixelLord' },
  { name: 'AeroAce', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AeroAce' },
  { name: 'QuantumGlitch', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Quantum' },
  { name: 'SolarisX', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Solaris' },
];

const BASE_SCORES: Record<string, number> = {
  dungeon: 24500,
  island: 18400,
  temple: 31200,
  galaxy: 42000,
  siege: 29800,
  drift: 56200,
  ufo: 33100,
  ninja: 44900,
  gladiator: 27500,
  highway: 68900,
  arena: 39500,
  jet: 48200,
  shooter: 52400,
  runner: 36700,
  haunted: 19800,
  sniper: 41200,
  cart: 34500,
  pool: 15600,
  hoop: 28400,
  penalty: 14200,
  duel: 22000,
  parking: 17800,
  hopper: 38900,
  lander: 26500,
  snake: 43200,
  pong: 19500,
  brick: 47800,
  racing: 58900,
  jumper: 35400,
  grid: 28900,
  memory: 16800,
  match: 32600,
};

function getSeedLeaderboard(gameId: string): LeaderboardEntry[] {
  const base = BASE_SCORES[gameId] || 25000;
  const now = Date.now();
  return SEED_PLAYERS.map((p, idx) => ({
    gameId,
    userId: `seed_${gameId}_${idx}`,
    displayName: p.name,
    photoURL: p.avatar,
    score: Math.max(100, Math.floor(base * (1 - idx * 0.11 + Math.sin(idx * 3) * 0.04))),
    submittedAt: new Date(now - (idx * 86400000 * 2.3 + 1800000)).toISOString(),
  })).sort((a, b) => b.score - a.score);
}

const STORAGE_KEY_PREFIX = 'zorvyq_lb_';

export async function fetchGameLeaderboard(gameId: string, limit = 15): Promise<LeaderboardEntry[]> {
  // Check localStorage first
  let entries: LeaderboardEntry[] = [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${gameId}`);
    if (raw) {
      entries = JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Could not read leaderboard from storage:', err);
  }

  if (!entries || entries.length === 0) {
    entries = getSeedLeaderboard(gameId);
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${gameId}`, JSON.stringify(entries));
    } catch {}
  }

  // Sort descending
  entries.sort((a, b) => b.score - a.score);
  return entries.slice(0, limit);
}

export async function submitGameScore(
  gameId: string,
  score: number,
  user: { uid: string; displayName: string; photoURL?: string | null }
): Promise<boolean> {
  if (!user || !user.uid || score <= 0) return false;

  try {
    const entries = await fetchGameLeaderboard(gameId, 50);
    const existingIndex = entries.findIndex((e) => e.userId === user.uid);
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      if (score <= entries[existingIndex].score) {
        return false; // Not a higher score
      }
      entries[existingIndex].score = Math.floor(score);
      entries[existingIndex].displayName = user.displayName || 'Anonymous Gamer';
      entries[existingIndex].photoURL = user.photoURL || '';
      entries[existingIndex].submittedAt = now;
    } else {
      entries.push({
        gameId,
        userId: user.uid,
        displayName: user.displayName || 'Anonymous Gamer',
        photoURL: user.photoURL || '',
        score: Math.floor(score),
        submittedAt: now,
      });
    }

    entries.sort((a, b) => b.score - a.score);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${gameId}`, JSON.stringify(entries));

    // Also update user's best scores in localStorage
    try {
      const bestScores = JSON.parse(localStorage.getItem('best') || '{}');
      bestScores[gameId] = Math.max(bestScores[gameId] || 0, Math.floor(score));
      localStorage.setItem('best', JSON.stringify(bestScores));
    } catch {}

    return true;
  } catch (err) {
    console.error('Error submitting score to leaderboard:', err);
    return false;
  }
}
