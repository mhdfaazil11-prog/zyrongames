/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GAMES, GameItem } from './gamesData.ts';
import { useAuth, AuthProvider, ZorvyqUser } from './AuthContext.tsx';
import { fetchGameLeaderboard, submitGameScore, LeaderboardEntry } from './leaderboardService.ts';
import {
  Trophy,
  User,
  LogOut,
  RotateCcw,
  Maximize,
  ExternalLink,
  X,
  Search,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Check,
  RefreshCw,
  Flame,
  Loader2,
  Gamepad2,
  Mail,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';

function ZorvyqApp() {
  const {
    user,
    loading: authLoading,
    loginGoogle,
    loginWithCode,
    loginAsGuest,
    sendCode,
    logout,
    syncCloudProgress,
  } = useAuth();

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activeHash, setActiveHash] = useState<string>(() => window.location.hash || '#/');
  const [showGameModal, setShowGameModal] = useState<boolean>(false);
  const [activeLeaderboardGame, setActiveLeaderboardGame] = useState<string | null>(null);
  const [leaderboardScores, setLeaderboardScores] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [pendingGameId, setPendingGameId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<'google' | 'code' | 'guest'>('google');
  const [customGames, setCustomGames] = useState<GameItem[]>([]);

  const loadSharedGames = useCallback(async () => {
    try {
      const res = await fetch('/api/custom-games');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.customGames)) {
          const formatted: GameItem[] = data.customGames
            .filter((cg: any) => cg.pub !== false)
            .map((cg: any) => ({
              id: `c_${cg.id}`,
              title: cg.t || 'Untitled Game',
              category: Array.isArray(cg.cats) ? cg.cats.join(' ') : 'Adventure',
              icon: cg.e || '🎮',
              color: 'from-blue-600 to-indigo-950',
              desc: cg.d || 'Custom created game on Zorvyq',
            }));
          setCustomGames(formatted);
        }
      }
    } catch (err) {
      console.warn('Could not load shared games in host:', err);
    }
  }, []);

  useEffect(() => {
    loadSharedGames();
  }, [loadSharedGames]);



  // Post auth state to the iframe
  const broadcastAuthState = useCallback(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          {
            type: 'AUTH_STATE',
            user: user
              ? {
                  uid: user.uid,
                  displayName: user.displayName,
                  photoURL: user.photoURL,
                  email: user.email,
                  provider: user.provider,
                }
              : null,
          },
          '*'
        );
      } catch (err) {
        console.warn('Could not post auth state to iframe:', err);
      }
    }
  }, [user]);

  useEffect(() => {
    broadcastAuthState();
  }, [user, broadcastAuthState]);

  // Focus iframe on launch
  const focusIframe = useCallback(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.focus();
      } catch {}
    }
  }, []);

  // Fetch leaderboard when game changes
  const loadLeaderboard = useCallback(async (gameId: string) => {
    setLeaderboardLoading(true);
    try {
      const records = await fetchGameLeaderboard(gameId, 15);
      setLeaderboardScores(records);
    } catch (err) {
      console.warn('Leaderboard fetch error:', err);
      setLeaderboardScores([]);
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeLeaderboardGame) {
      loadLeaderboard(activeLeaderboardGame);
    }
  }, [activeLeaderboardGame, loadLeaderboard]);

  // Sync hash changes
  useEffect(() => {
    const handleHash = () => {
      const current = window.location.hash || '#/';
      setActiveHash(current);
      if (iframeRef.current && iframeRef.current.contentWindow) {
        try {
          if (iframeRef.current.contentWindow.location.hash !== current) {
            iframeRef.current.contentWindow.location.hash = current;
          }
        } catch {}
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Launch a game
  const launchGame = useCallback((gameId: string) => {
    const hash = `#/g/${gameId}`;
    window.location.hash = hash;
    setActiveHash(hash);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.location.hash = hash;
        iframeRef.current.contentWindow.focus();
      } catch {}
    }
    setShowGameModal(false);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setShowUserDropdown(false);
      setToastMessage('Signed out successfully.');
      setTimeout(() => setToastMessage(null), 3000);
      broadcastAuthState();
    } catch (err) {
      console.warn('Logout error:', err);
    }
  }, [logout, broadcastAuthState]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setAuthError(null);
      await loginGoogle();
      setShowAuthModal(false);
      setToastMessage('🎉 Signed in directly with Google (Mhd Faazil)!');
      setTimeout(() => setToastMessage(null), 4000);
      if (pendingGameId) {
        launchGame(pendingGameId);
        setPendingGameId(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in encountered an issue.';
      setAuthError(msg);
    } finally {
      focusIframe();
    }
  }, [loginGoogle, pendingGameId, launchGame, focusIframe]);

  // Handle postMessage events from iframe
  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      if (!e.data) return;

      if (e.data.type === 'TRIGGER_LOGIN') {
        // Connect directly to Google as requested by user
        await handleGoogleSignIn();
      } else if (e.data.type === 'CUSTOM_GAMES_UPDATED') {
        loadSharedGames();
      } else if (e.data.type === 'TRIGGER_LOGOUT') {
        await handleLogout();
      } else if (e.data.type === 'SHOW_LEADERBOARD') {
        setActiveLeaderboardGame(e.data.gameId || 'dungeon');
      } else if (e.data.type === 'GAME_OVER') {
        const { gameId, score } = e.data;
        if (score && score > 0) {
          const activeUser = user || {
            uid: 'guest_gamer',
            displayName: 'Guest Gamer',
            photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=Guest',
            provider: 'guest' as const,
            createdAt: new Date().toISOString(),
          };
          try {
            const isHighScore = await submitGameScore(gameId, score, activeUser);
            if (isHighScore) {
              setToastMessage(`🏆 New High Score: ${Number(score).toLocaleString()} pts saved to Leaderboard!`);
              setTimeout(() => setToastMessage(null), 4500);
              if (activeLeaderboardGame === gameId) {
                loadLeaderboard(gameId);
              }
            }
          } catch (err) {
            console.warn('Could not auto-submit score:', err);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user, activeLeaderboardGame, loadLeaderboard, handleGoogleSignIn, loadSharedGames, handleLogout]);

  const handleIframeLoad = () => {
    focusIframe();
    broadcastAuthState();
    try {
      const iframeWindow = iframeRef.current?.contentWindow;
      if (iframeWindow) {
        iframeWindow.addEventListener('hashchange', () => {
          const current = iframeWindow.location.hash || '#/';
          if (window.location.hash !== current) {
            window.location.hash = current;
            setActiveHash(current);
          }
        });
        iframeWindow.addEventListener('click', () => {
          iframeWindow.focus();
        });
      }
    } catch {}
  };

  const handleReload = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.location.reload();
      } catch {
        iframeRef.current.src = `/assets/aistudio/NG_GAMES_9893326f.html${activeHash}`;
      }
    }
  };

  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    focusIframe();
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await syncCloudProgress();
    setTimeout(() => setIsSyncing(false), 600);
  };


  // Merge base games with custom games added from any device
  const allGames = useMemo(() => {
    const existingIds = new Set(GAMES.map((g) => g.id));
    const uniqueCustom = customGames.filter((cg) => !existingIds.has(cg.id));
    return [...GAMES, ...uniqueCustom];
  }, [customGames]);

  // Genre list
  const genres = useMemo(() => {
    const list = new Set<string>();
    list.add('All');
    allGames.forEach((g) => {
      g.category.split(' ').forEach((c) => {
        if (['Adventure', 'Racing', '3D', 'Arcade', 'Sports', 'Action', 'Horror', 'Simulation', 'Puzzle'].includes(c)) {
          list.add(c);
        }
      });
    });
    return Array.from(list);
  }, [allGames]);

  // Filtered games
  const filteredGames = useMemo(() => {
    return allGames.filter((g) => {
      const matchQuery =
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.desc.toLowerCase().includes(searchQuery.toLowerCase());
      const matchGenre = selectedGenre === 'All' || g.category.toLowerCase().includes(selectedGenre.toLowerCase());
      return matchQuery && matchGenre;
    });
  }, [allGames, searchQuery, selectedGenre]);

  const currentGame = useMemo(() => {
    return allGames.find((g) => g.id === activeLeaderboardGame) || allGames[0] || GAMES[0];
  }, [allGames, activeLeaderboardGame]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#05070f] text-[#e8eeff] select-none font-sans">
      {/* High score celebratory toast */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-amber-500/90 to-yellow-600/90 backdrop-blur-md text-black font-bold text-xs rounded-full shadow-[0_0_30px_rgba(245,158,11,0.5)] border border-yellow-300 animate-in fade-in slide-in-from-top-4 duration-300">
          <Sparkles className="w-4 h-4 text-black shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-1 opacity-70 hover:opacity-100 transition-opacity">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Game Engine iFrame */}
      <iframe
        ref={iframeRef}
        id="ng-games-frame"
        title="ZYRON - PLAY BEYOND LIMITS."
        src={`/assets/aistudio/NG_GAMES_9893326f.html${activeHash}`}
        className="w-full h-full border-none block bg-[#05070f]"
        allow="fullscreen; autoplay; gamepad"
        onLoad={handleIframeLoad}
      />

      {/* Floating Header HUD */}
      <div className="fixed top-3 right-4 z-40 flex items-center gap-2">
        {isCollapsed ? (
          <button
            onClick={() => setIsCollapsed(false)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[#070c1d]/85 backdrop-blur-md border border-[#1b2a55] hover:border-[#2f7bff] rounded-full shadow-lg transition-all"
            title="Expand game tools"
          >
            <img src="/assets/aistudio/image_7b7a27be.png" alt="ZYRON" className="w-3.5 h-3.5 object-contain" />
            <span className="text-[11px] font-bold text-white tracking-wider">ZYRON</span>
            {user && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
            <ChevronDown className="w-3 h-3 text-[#8fa3d6]" />
          </button>
        ) : (
          <div className="flex items-center gap-1.5 p-1.5 bg-[#070c1d]/90 backdrop-blur-md border border-[#1b2a55] rounded-full shadow-2xl">
            {/* Games Library Launcher */}
            <button
              onClick={() => setShowGameModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full shadow-lg transition-all cursor-pointer"
              title={`Browse all ${allGames.length}+ games`}
            >
              <img src="/assets/aistudio/image_7b7a27be.png" alt="ZYRON" className="w-4 h-4 object-contain" />
              <span className="font-bold tracking-wide">Games ({allGames.length}+)</span>
            </button>

            {/* Leaderboards */}
            <button
              onClick={() => {
                const currentId = activeHash.startsWith('#/g/') ? activeHash.replace('#/g/', '') : 'dungeon';
                setActiveLeaderboardGame(currentId);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-amber-500/20 to-yellow-600/20 hover:from-amber-500/30 hover:to-yellow-600/30 text-amber-300 border border-amber-500/30 rounded-full transition-all cursor-pointer"
              title="Global Game Leaderboards"
            >
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span>Leaderboards</span>
            </button>

            {/* User Profile / Sign In */}
            {user ? (
              <div className="relative flex items-center gap-1">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[#0b142d] hover:bg-[#152347] border border-[#1b2a55] text-white rounded-full transition-colors cursor-pointer"
                  title="Player Profile"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-4 h-4 rounded-full object-cover ring-1 ring-cyan-400"
                    />
                  ) : (
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  <span className="font-medium text-white max-w-[85px] truncate">
                    {user.displayName.split(' ')[0]}
                  </span>
                  <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40">
                    {user.provider}
                  </span>
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 hover:text-white rounded-full transition-colors cursor-pointer"
                  title="Sign Out of ZYRON"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign Out</span>
                </button>

                {/* Profile Dropdown */}
                {showUserDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-[#0b1228] border border-[#2f7bff]/40 rounded-2xl shadow-2xl z-50 text-left animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2.5 pb-2.5 mb-2 border-b border-[#1b2a55]">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full ring-1 ring-cyan-400" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                          {user.displayName[0] || 'U'}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-white truncate">{user.displayName}</p>
                        <p className="text-[10px] text-[#8fa3d6] truncate">
                          {user.email || user.phoneNumber || `${user.provider} account`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#8fa3d6] bg-[#070c1d] p-2 rounded-xl mb-2.5">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>
                          {user.provider === 'google'
                            ? 'Google Connected'
                            : `${user.provider.toUpperCase()} Verified`}
                        </span>
                      </div>
                      <button
                        onClick={handleSync}
                        className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-white transition-colors"
                        title="Force Sync"
                      >
                        <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>Sync</span>
                      </button>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-red-400 hover:text-white bg-red-950/40 hover:bg-red-900/60 rounded-xl transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                disabled={authLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white text-[#1f2937] hover:bg-gray-100 rounded-full shadow transition-all cursor-pointer"
                title="1-Click Connect with Google"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>{authLoading ? 'Signing in...' : 'Sign In with Google'}</span>
              </button>
            )}

            {/* Quick Actions */}
            <button
              onClick={handleReload}
              className="p-1.5 hover:bg-[#152347] text-[#8fa3d6] hover:text-white rounded-full transition-colors cursor-pointer"
              title="Restart Game"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleFullscreen}
              className="p-1.5 hover:bg-[#152347] text-[#8fa3d6] hover:text-white rounded-full transition-colors cursor-pointer"
              title="Fullscreen"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>

            <a
              href={`/assets/aistudio/NG_GAMES_9893326f.html${activeHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 hover:bg-[#152347] text-[#8fa3d6] hover:text-white rounded-full transition-colors"
              title="Open standalone ZYRON page"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 hover:bg-[#152347] text-[#55699c] hover:text-white rounded-full transition-colors cursor-pointer"
              title="Collapse game tools"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Sign In Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-[#0b1228] border border-[#2f7bff]/60 rounded-3xl p-6 sm:p-7 text-center shadow-2xl">
            <button
              onClick={() => {
                setShowAuthModal(false);
                setAuthError(null);
              }}
              className="absolute top-4 right-4 p-2 text-[#8fa3d6] hover:text-white hover:bg-[#1b2a55] rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center mb-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/30 to-indigo-900/40 border border-blue-500/40 flex items-center justify-center mb-3.5 shadow-lg">
                <img src="/assets/aistudio/image_7b7a27be.png" alt="ZYRON" className="w-9 h-9 object-contain" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">Welcome to ZYRON</h2>
              <p className="text-xs text-[#8fa3d6] mt-2 max-w-xs leading-relaxed">
                Connect your account to save high scores, unlock verified badges, and rank on global leaderboards.
              </p>
            </div>

            {/* Direct Continue with Google Button (same as ChatGPT) */}
            <button
              onClick={handleGoogleSignIn}
              disabled={authLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-2xl shadow-xl transition-all active:scale-[0.99] cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{authLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            <p className="text-[11px] text-[#55699c] mt-4">
              Instant 1-click connect • Verified scores • Cloud sync
            </p>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {activeLeaderboardGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#0b1228] border border-[#eab308]/50 rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1b2a55] bg-[#070c1d]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl shadow-inner">
                  {currentGame.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-white tracking-wide">
                      {currentGame.title} Leaderboard
                    </h2>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                      LIVE RANKS
                    </span>
                  </div>
                  <p className="text-xs text-[#8fa3d6]">Top verified high scores from signed-in players</p>
                </div>
              </div>

              <button
                onClick={() => setActiveLeaderboardGame(null)}
                className="p-1.5 text-[#8fa3d6] hover:text-white hover:bg-[#1b2a55] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Horizontal Game Selector */}
            <div className="px-6 py-3 bg-[#080e22] border-b border-[#1b2a55] flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-[#8fa3d6] whitespace-nowrap font-semibold">Select Game:</span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {GAMES.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setActiveLeaderboardGame(g.id)}
                    className={`whitespace-nowrap px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
                      activeLeaderboardGame === g.id
                        ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                        : 'bg-[#0f172a] text-[#8fa3d6] hover:text-white border border-[#1b2a55]'
                    }`}
                  >
                    {g.icon} {g.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Scores List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
              {leaderboardLoading ? (
                <div className="py-16 text-center text-[#8fa3d6]">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin text-amber-400 mb-2" />
                  <p className="text-xs">Fetching global leaderboard...</p>
                </div>
              ) : leaderboardScores.length > 0 ? (
                leaderboardScores.map((entry, index) => {
                  const rank = index + 1;
                  const isCurrentPlayer = user?.uid === entry.userId;
                  return (
                    <div
                      key={entry.userId || index}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                        isCurrentPlayer
                          ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/30'
                          : rank <= 3
                          ? 'bg-[#0e1633] border-[#22356b]'
                          : 'bg-[#090f24] border-[#16234b]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 text-center font-bold">
                          {rank === 1 && <span className="text-xl" title="1st Place">🥇</span>}
                          {rank === 2 && <span className="text-xl" title="2nd Place">🥈</span>}
                          {rank === 3 && <span className="text-xl" title="3rd Place">🥉</span>}
                          {rank > 3 && <span className="text-xs text-[#8fa3d6]">#{rank}</span>}
                        </div>

                        {entry.photoURL ? (
                          <img
                            src={entry.photoURL}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover ring-1 ring-[#1b2a55]"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center font-bold text-xs text-white">
                            {entry.displayName ? entry.displayName[0] : 'G'}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-white">{entry.displayName || 'Gamer'}</p>
                            {isCurrentPlayer && (
                              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-bold">
                                YOU
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#8fa3d6]">
                            {new Date(entry.submittedAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base sm:text-lg font-black text-amber-400 tracking-wider font-mono">
                          {entry.score.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-[#8fa3d6] block">PTS</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-14 text-center text-[#8fa3d6]">
                  <Flame className="w-10 h-10 mx-auto text-amber-500/40 mb-2" />
                  <p className="text-sm font-semibold text-white">No leaderboard records yet!</p>
                  <p className="text-xs text-[#8fa3d6] mt-1">
                    Be the very first player to set a high score in {currentGame.title}!
                  </p>
                  <button
                    onClick={() => {
                      setActiveLeaderboardGame(null);
                      launchGame(currentGame.id);
                    }}
                    className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs rounded-full shadow-lg hover:scale-105 transition-all cursor-pointer"
                  >
                    Play {currentGame.title} Now
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-[#1b2a55] bg-[#070c1d] text-xs">
              <span className="text-[#8fa3d6]">Scores update live after each completed game</span>
              <button
                onClick={() => {
                  setActiveLeaderboardGame(null);
                  launchGame(currentGame.id);
                }}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-full transition-transform active:scale-95 cursor-pointer"
              >
                Play {currentGame.title}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Library Launcher Modal */}
      {showGameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col bg-[#0b1228] border border-[#2f7bff]/40 rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#1b2a55] bg-[#070c1d]">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/aistudio/image_7b7a27be.png"
                  alt="ZYRON"
                  className="w-9 h-9 object-contain drop-shadow-[0_0_12px_rgba(47,123,255,0.5)]"
                />
                <div>
                  <h2 className="text-base font-black text-white tracking-wider flex items-center gap-2">
                    ZYRON{' '}
                    <span className="text-[10px] font-bold text-cyan-400 bg-blue-500/20 px-2 py-0.5 rounded-md border border-blue-500/30 tracking-widest">
                      PLAY BEYOND LIMITS.
                    </span>
                  </h2>
                  <p className="text-xs text-[#8fa3d6]">{allGames.length}+ original browser games • Zero downloads • Instant play</p>
                </div>
              </div>

              <button
                onClick={() => setShowGameModal(false)}
                className="p-1.5 text-[#8fa3d6] hover:text-white hover:bg-[#1b2a55] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User status subheader */}
            <div className="flex items-center justify-between px-6 py-2.5 bg-[#080e22] border-b border-[#1b2a55] text-xs">
              {user ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 text-[#8fa3d6]">
                    {user.photoURL && <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full" />}
                    <span>
                      Signed in as <b className="text-white">{user.displayName}</b>
                    </span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40">
                      {user.provider}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-white font-semibold cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <span className="text-[#8fa3d6]">
                    Sign in to track high scores and compete on global leaderboards:
                  </span>
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={authLoading}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white text-gray-900 font-bold rounded-full text-xs hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Sign In with Google</span>
                  </button>
                </div>
              )}
            </div>

            {/* Search & Genre Filters */}
            <div className="p-4 border-b border-[#1b2a55] bg-[#090f22] space-y-3">
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 w-4 h-4 text-[#8fa3d6]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by title or genre (Adventure, Racing, Arcade, Sports, Horror, Shooter, 3D)..."
                  className="w-full pl-10 pr-4 py-2 bg-[#070c1d] border border-[#1b2a55] focus:border-[#2f7bff] rounded-xl text-xs text-white placeholder-[#55699c] outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 text-[#8fa3d6] hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
                {genres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      selectedGenre === genre
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-[#0e1633] text-[#8fa3d6] hover:text-white border border-[#1b2a55]'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Game Grid */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredGames.map((game) => (
                <div
                  key={game.id}
                  className="group relative flex flex-col justify-between p-3 bg-[#0e1633] hover:bg-[#142048] border border-[#1b2a55] hover:border-[#2f7bff] rounded-xl transition-all shadow-md"
                >
                  <button onClick={() => launchGame(game.id)} className="w-full text-left cursor-pointer">
                    <div
                      className={`w-full aspect-[4/3] rounded-lg bg-gradient-to-br ${game.color} flex items-center justify-center text-3xl mb-2.5 shadow-inner`}
                    >
                      <span className="group-hover:scale-110 transition-transform">{game.icon}</span>
                    </div>
                    <h3 className="text-xs font-bold text-white group-hover:text-cyan-400 line-clamp-1">
                      {game.title}
                    </h3>
                    <span className="text-[10px] text-[#8fa3d6] font-medium mt-0.5 block">{game.category}</span>
                  </button>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#1b2a55]/60 text-[11px]">
                    <button
                      onClick={() => launchGame(game.id)}
                      className="text-xs font-bold text-cyan-400 hover:text-white cursor-pointer"
                    >
                      ▶ Play
                    </button>
                    <button
                      onClick={() => {
                        setShowGameModal(false);
                        setActiveLeaderboardGame(game.id);
                      }}
                      className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                    >
                      <Trophy className="w-3 h-3" />
                      <span>Ranks</span>
                    </button>
                  </div>
                </div>
              ))}

              {filteredGames.length === 0 && (
                <div className="col-span-full py-12 text-center text-[#8fa3d6]">
                  <p className="text-sm">No games matching “{searchQuery}”</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedGenre('All');
                    }}
                    className="mt-2 text-xs text-blue-400 hover:underline cursor-pointer"
                  >
                    Clear search filters
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#1b2a55] bg-[#070c1d] text-xs text-[#8fa3d6]">
              <span>32+ Original Games • Google, Mobile, Email, and Apple Supported</span>
              <button
                onClick={() => {
                  window.location.hash = '#/';
                  setActiveHash('#/');
                  setShowGameModal(false);
                }}
                className="text-blue-400 hover:underline cursor-pointer"
              >
                Go to Portal Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ZorvyqApp />
    </AuthProvider>
  );
}
