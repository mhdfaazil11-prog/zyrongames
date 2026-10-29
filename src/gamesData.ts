export interface GameItem {
  id: string;
  title: string;
  category: string;
  icon: string;
  color: string;
  desc: string;
}

export const GAMES: GameItem[] = [
  {
    "id": "dungeon",
    "title": "Dungeon Explorer",
    "category": "Adventure RPG",
    "icon": "🗡️",
    "color": "from-purple-600 to-indigo-950",
    "desc": "Delve into ancient crypts, defeat skeletons, gather keys and conquer the catacombs"
  },
  {
    "id": "island",
    "title": "Lost Island",
    "category": "Adventure Survival",
    "icon": "🏝️",
    "color": "from-emerald-600 to-teal-950",
    "desc": "Shipwrecked castaway: forage coconuts, dodge wild boars, and activate ancient island beacons"
  },
  {
    "id": "temple",
    "title": "Temple Quest",
    "category": "Adventure Platformer",
    "icon": "🗿",
    "color": "from-amber-600 to-amber-950",
    "desc": "Infiltrate ancient Aztec ruins, double jump spike pits and slide under pendulum blades"
  },
  {
    "id": "galaxy",
    "title": "Cosmic Odyssey",
    "category": "Adventure 3D Space",
    "icon": "🪐",
    "color": "from-blue-600 to-cyan-950",
    "desc": "Chart deep space star systems, orbit alien worlds, deploy mining probes and harvest cores"
  },
  {
    "id": "siege",
    "title": "Viking Siege Defense",
    "category": "Action Strategy",
    "icon": "🏰",
    "color": "from-red-600 to-rose-950",
    "desc": "Defend castle gates from raiding Viking longboats and berserkers using stone ballistas"
  },
  {
    "id": "drift",
    "title": "Cyber Drift 2088",
    "category": "3D Racing",
    "icon": "🏎️",
    "color": "from-cyan-500 to-purple-950",
    "desc": "Neon synthwave highway drift racer! Slide corners to charge Nitro and hit warp speed"
  },
  {
    "id": "ufo",
    "title": "Cosmic Beam Abductor",
    "category": "Arcade Action",
    "icon": "🛸",
    "color": "from-violet-600 to-slate-950",
    "desc": "Pilot an alien flying saucer beam to tractor-beam cosmic energy crystals while evading radar"
  },
  {
    "id": "ninja",
    "title": "Shadow Blade Katana",
    "category": "Action Reflex",
    "icon": "🥷",
    "color": "from-rose-600 to-zinc-950",
    "desc": "Fast ninja reflex katana slasher! Slice flying demon masks, shurikens and trigger combo chains"
  },
  {
    "id": "gladiator",
    "title": "Colosseum Gladiator",
    "category": "Combat Action",
    "icon": "⚔️",
    "color": "from-amber-500 to-orange-950",
    "desc": "Roman arena duel against champion gladiators and lions with sword, shield parry and dodge"
  },
  {
    "id": "highway",
    "title": "Highway Racer 3D",
    "category": "3D Racing",
    "icon": "🏁",
    "color": "from-amber-600 to-yellow-900",
    "desc": "Pseudo-3D highway with day/night, rain, automatic gears & sound"
  },
  {
    "id": "arena",
    "title": "Survival Arena",
    "category": "Survival Action",
    "icon": "💀",
    "color": "from-red-600 to-rose-950",
    "desc": "Survive relentless swarms in a dark arena with flashlight & weapons"
  },
  {
    "id": "jet",
    "title": "Jet Rush",
    "category": "Arcade",
    "icon": "🎒",
    "color": "from-blue-600 to-cyan-950",
    "desc": "Fly through research labs avoiding zappers & grabbing coins"
  },
  {
    "id": "shooter",
    "title": "Space Shooter",
    "category": "Arcade Shooter",
    "icon": "🚀",
    "color": "from-purple-600 to-indigo-950",
    "desc": "Alien wave defense with momentum drift and particle physics"
  },
  {
    "id": "runner",
    "title": "Endless Runner",
    "category": "Action Arcade",
    "icon": "🏃",
    "color": "from-orange-500 to-purple-900",
    "desc": "Sprint through dusk desert with momentum physics and ramps"
  },
  {
    "id": "haunted",
    "title": "Haunted Escape",
    "category": "Horror Survival",
    "icon": "👻",
    "color": "from-fuchsia-900 to-black",
    "desc": "Find 3 keys in pitch dark while hunting entity stalks you"
  },
  {
    "id": "sniper",
    "title": "Marksman Range",
    "category": "Simulation",
    "icon": "🎯",
    "color": "from-amber-500 to-slate-900",
    "desc": "Scope sway, breath steadier, and wind compensation"
  },
  {
    "id": "cart",
    "title": "Cave Cart",
    "category": "3D Adventure",
    "icon": "⛏️",
    "color": "from-stone-600 to-amber-950",
    "desc": "3-lane high speed minecart runner in deep cavern"
  },
  {
    "id": "pool",
    "title": "Pool Master",
    "category": "Physics Sports",
    "icon": "🎱",
    "color": "from-emerald-600 to-emerald-950",
    "desc": "Elastic collisions, rolling friction and cushion rebounds"
  },
  {
    "id": "hoop",
    "title": "Hoop Shots",
    "category": "Sports Arcade",
    "icon": "🏀",
    "color": "from-orange-600 to-amber-950",
    "desc": "60-second free throw challenge with real rim rebounds"
  },
  {
    "id": "penalty",
    "title": "Penalty Kicks",
    "category": "Football Sports",
    "icon": "⚽",
    "color": "from-green-600 to-emerald-950",
    "desc": "Timed power meter against reactive goalkeeper"
  },
  {
    "id": "duel",
    "title": "Tank Duel 2P",
    "category": "2-Player Local",
    "icon": "🛡️",
    "color": "from-cyan-700 to-slate-950",
    "desc": "Ricochet tank battle for 2 players on one keyboard"
  },
  {
    "id": "parking",
    "title": "Parking Challenge",
    "category": "Simulation",
    "icon": "🅿️",
    "color": "from-slate-600 to-zinc-950",
    "desc": "Realistic bicycle steering geometry and tight bays"
  },
  {
    "id": "hopper",
    "title": "Neon Hopper",
    "category": "Rhythm Platformer",
    "icon": "🔷",
    "color": "from-fuchsia-600 to-violet-950",
    "desc": "Auto-running neon cube reflex gauntlet"
  },
  {
    "id": "lander",
    "title": "Moon Lander",
    "category": "Physics Arcade",
    "icon": "🌙",
    "color": "from-zinc-500 to-black",
    "desc": "Inertia, rotation, and fuel conservation landing challenge"
  },
  {
    "id": "snake",
    "title": "Classic Snake",
    "category": "Retro Arcade",
    "icon": "🐍",
    "color": "from-teal-600 to-teal-950",
    "desc": "Smooth directional snake with dynamic scoring"
  },
  {
    "id": "pong",
    "title": "Ping Pong",
    "category": "Sports Arcade",
    "icon": "🏓",
    "color": "from-cyan-600 to-blue-950",
    "desc": "Spin ball physics against reflex-limited AI"
  },
  {
    "id": "brick",
    "title": "Brick Breaker",
    "category": "Retro Arcade",
    "icon": "🧱",
    "color": "from-pink-600 to-purple-950",
    "desc": "Paddle angle controls and multi-level brick patterns"
  },
  {
    "id": "racing",
    "title": "Car Racing",
    "category": "Arcade Racing",
    "icon": "🏎️",
    "color": "from-blue-600 to-blue-950",
    "desc": "High-speed highway lane weaving with inertia"
  },
  {
    "id": "jumper",
    "title": "Platform Jumper",
    "category": "Casual Platformer",
    "icon": "🦘",
    "color": "from-emerald-500 to-sky-950",
    "desc": "Screen wrapping bounce adventure"
  },
  {
    "id": "grid",
    "title": "Crimson Grid",
    "category": "Hardcore Precision",
    "icon": "🟥",
    "color": "from-red-600 to-red-950",
    "desc": "Precision orb evasion across 5 treacherous stages"
  },
  {
    "id": "memory",
    "title": "Memory Cards",
    "category": "Casual Puzzle",
    "icon": "🃏",
    "color": "from-purple-600 to-indigo-950",
    "desc": "3D flipping cards memory game"
  },
  {
    "id": "match",
    "title": "Puzzle Match",
    "category": "Casual Strategy",
    "icon": "🧩",
    "color": "from-amber-500 to-purple-900",
    "desc": "Quadratic scoring chain puzzle"
  }
];
