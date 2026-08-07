import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Trophy, Flame, Play, RotateCcw, HelpCircle, Sparkles, Volume2, VolumeX, Shield, RefreshCcw } from 'lucide-react';
import { Position, Direction, FoodItem, FoodType, Difficulty, GameState, Particle, ScoreRecord } from './types';
import GameBoard from './components/GameBoard';
import GameControls from './components/GameControls';
import GameStats from './components/GameStats';
import {
  playEatNormal,
  playEatSpecial,
  playTurn,
  playGameOver,
  playStart,
  playPause,
  playResume,
  playClick,
  toggleMute,
  getMuteState,
} from './utils/audio';

const GRID_SIZE = 20;

// Default initial snake in the middle, facing upwards
const INITIAL_SNAKE: Position[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];

const TICK_RATES: Record<Difficulty, number> = {
  EASY: 180,
  MEDIUM: 120,
  HARD: 85,
  EXPERT: 55,
};

export default function App() {
  // Game states
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>('UP');
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [obstacles, setObstacles] = useState<Position[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [obstaclesEnabled, setObstaclesEnabled] = useState(false);
  const [showGridLines, setShowGridLines] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [scoreHistory, setScoreHistory] = useState<ScoreRecord[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Powerup state
  const [speedBoostActive, setSpeedBoostActive] = useState(false);
  const [speedBoostDuration, setSpeedBoostDuration] = useState(0);

  // Direction buffering to prevent fast double-clicks leading to self-collision
  const currentDirRef = useRef<Direction>('UP');
  const nextDirRef = useRef<Direction>('UP');

  // Load scores and preferences from localStorage on mount
  useEffect(() => {
    try {
      const storedHighScore = localStorage.getItem('snake_high_score');
      if (storedHighScore) setHighScore(parseInt(storedHighScore, 10));

      const storedHistory = localStorage.getItem('snake_score_history');
      if (storedHistory) setScoreHistory(JSON.parse(storedHistory));

      const storedMute = localStorage.getItem('snake_muted');
      if (storedMute) {
        const muteVal = JSON.parse(storedMute);
        setIsMuted(muteVal);
        if (muteVal !== getMuteState()) {
          toggleMute();
        }
      }

      const storedGrid = localStorage.getItem('snake_grid_lines');
      if (storedGrid) setShowGridLines(JSON.parse(storedGrid));

      const storedObstacles = localStorage.getItem('snake_obstacles_enabled');
      if (storedObstacles) setObstaclesEnabled(JSON.parse(storedObstacles));
    } catch (e) {
      console.error('Failed to load local storage settings', e);
    }
  }, []);

  // Update current direction ref when state changes
  useEffect(() => {
    currentDirRef.current = direction;
  }, [direction]);

  // Handle active power-up timers
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const timer = setInterval(() => {
      // Speed chilli booster countdown
      if (speedBoostActive) {
        setSpeedBoostDuration((prev) => {
          if (prev <= 1) {
            setSpeedBoostActive(false);
            return 0;
          }
          return prev - 1;
        });
      }

      // Filter out expired foods from the board
      setFoods((prevFoods) =>
        prevFoods.filter((food) => {
          if (food.expiresAt && food.expiresAt < Date.now()) {
            return false; // Expired!
          }
          return true;
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, speedBoostActive]);

  // Helper: Find a random position that doesn't overlap snake, food, or obstacles
  const getRandomEmptyPosition = useCallback(
    (currentSnake: Position[], currentObstacles: Position[], currentFoods: FoodItem[]): Position => {
      let attempts = 0;
      const snakeSet = new Set(currentSnake.map((s) => `${s.x},${s.y}`));
      const obstacleSet = new Set(currentObstacles.map((o) => `${o.x},${o.y}`));
      const foodSet = new Set(currentFoods.map((f) => `${f.position.x},${f.position.y}`));

      while (attempts < 250) {
        const x = Math.floor(Math.random() * GRID_SIZE);
        const y = Math.floor(Math.random() * GRID_SIZE);
        const key = `${x},${y}`;

        if (!snakeSet.has(key) && !obstacleSet.has(key) && !foodSet.has(key)) {
          return { x, y };
        }
        attempts++;
      }

      // Sequential fallback if random search fails (board highly crowded)
      for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
          const key = `${x},${y}`;
          if (!snakeSet.has(key) && !obstacleSet.has(key) && !foodSet.has(key)) {
            return { x, y };
          }
        }
      }

      return { x: 0, y: 0 }; // extreme emergency fallback
    },
    []
  );

  // Helper: Spawn food item of specified type
  const spawnFoodItem = useCallback(
    (type: FoodType, currentSnake: Position[], currentObstacles: Position[], currentFoods: FoodItem[]): FoodItem => {
      const pos = getRandomEmptyPosition(currentSnake, currentObstacles, currentFoods);

      let points = 1;
      let color = '#ef4444'; // Red for normal apple
      let glowColor = 'rgba(239, 68, 68, 0.6)';
      let expiresAt: number | undefined;

      if (type === 'GOLDEN') {
        points = 3;
        color = '#fbbf24'; // Golden amber
        glowColor = 'rgba(251, 191, 36, 0.8)';
        expiresAt = Date.now() + 8000; // expires in 8 seconds
      } else if (type === 'SPEEDY') {
        points = 2;
        color = '#ec4899'; // Purple hot pepper pink
        glowColor = 'rgba(236, 72, 153, 0.8)';
        expiresAt = Date.now() + 10000; // expires in 10 seconds
      } else if (type === 'SHRINK') {
        points = 1;
        color = '#38bdf8'; // Sky blue shield blueberry
        glowColor = 'rgba(56, 189, 248, 0.8)';
        expiresAt = Date.now() + 12000; // expires in 12 seconds
      }

      return {
        position: pos,
        type,
        points,
        color,
        glowColor,
        expiresAt,
      };
    },
    [getRandomEmptyPosition]
  );

  // Particle explosion creator
  const createExplosion = useCallback((x: number, y: number, color: string) => {
    // Canvas coords
    const boardEl = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!boardEl) return;
    const size = boardEl.width;
    const cellSize = size / GRID_SIZE;

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;

    const count = 15;
    const newParticles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.5 + 1;
      newParticles.push({
        id: Math.random().toString(),
        x: centerX,
        y: centerY,
        color,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 1.5,
        alpha: 1.0,
      });
    }

    setParticles((prev) => [...prev, ...newParticles]);
  }, []);

  // Generate obstacles away from middle
  const generateObstacles = useCallback((): Position[] => {
    const list: Position[] = [];
    const snakeInitialCoords = ['10,10', '10,11', '10,12', '10,9', '10,8', '11,10', '9,10']; // protected starting area
    const protectedSet = new Set(snakeInitialCoords);

    let attempts = 0;
    const count = Math.floor(Math.random() * 4) + 5; // 5 to 8 stones

    while (list.length < count && attempts < 100) {
      const ox = Math.floor(Math.random() * GRID_SIZE);
      const oy = Math.floor(Math.random() * GRID_SIZE);
      const key = `${ox},${oy}`;

      if (!protectedSet.has(key) && !list.some((o) => o.x === ox && o.y === oy)) {
        list.push({ x: ox, y: oy });
      }
      attempts++;
    }

    return list;
  }, []);

  // Initialize Game Start State
  const handleStartGame = useCallback(() => {
    playStart();

    // Setup initial board elements
    const newObstacles = obstaclesEnabled ? generateObstacles() : [];
    const firstFood = spawnFoodItem('NORMAL', INITIAL_SNAKE, newObstacles, []);

    setSnake(INITIAL_SNAKE);
    setDirection('UP');
    nextDirRef.current = 'UP';
    setFoods([firstFood]);
    setObstacles(newObstacles);
    setScore(0);
    setSpeedBoostActive(false);
    setSpeedBoostDuration(0);
    setParticles([]);
    setGameState('PLAYING');
  }, [obstaclesEnabled, generateObstacles, spawnFoodItem]);

  // Toggle Pause Game
  const handlePauseGame = useCallback(() => {
    if (gameState === 'PLAYING') {
      playPause();
      setGameState('PAUSED');
    } else if (gameState === 'PAUSED') {
      playResume();
      setGameState('PLAYING');
    }
  }, [gameState]);

  // Handle direction changing securely
  const handleDirectionChange = useCallback((newDir: Direction) => {
    const currentDir = currentDirRef.current;

    // Check illegal 180-degree immediate turns
    if (newDir === 'UP' && currentDir === 'DOWN') return;
    if (newDir === 'DOWN' && currentDir === 'UP') return;
    if (newDir === 'LEFT' && currentDir === 'RIGHT') return;
    if (newDir === 'RIGHT' && currentDir === 'LEFT') return;

    if (newDir !== currentDir) {
      playTurn();
    }
    nextDirRef.current = newDir;
    setDirection(newDir);
  }, []);

  // Save score to local storage records
  const saveHighScore = useCallback(
    (finalScore: number) => {
      // 1. Update personal best highscore
      let newHigh = highScore;
      if (finalScore > highScore) {
        newHigh = finalScore;
        setHighScore(finalScore);
        localStorage.setItem('snake_high_score', finalScore.toString());
      }

      // 2. Add score history item
      const newRecord: ScoreRecord = {
        score: finalScore,
        difficulty,
        obstacles: obstaclesEnabled,
        date: new Date().toLocaleDateString('ru-RU', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      const updatedHistory = [newRecord, ...scoreHistory].slice(0, 10); // keep top 10 items
      setScoreHistory(updatedHistory);
      localStorage.setItem('snake_score_history', JSON.stringify(updatedHistory));
    },
    [highScore, difficulty, obstaclesEnabled, scoreHistory]
  );

  // Trigger game over logic
  const handleGameOver = useCallback(() => {
    playGameOver();
    setGameState('GAME_OVER');
    saveHighScore(score);
  }, [score, saveHighScore]);

  // Core movement engine called on each tick
  const moveSnake = useCallback(() => {
    if (gameState !== 'PLAYING') return;

    setSnake((prevSnake) => {
      if (prevSnake.length === 0) return prevSnake;

      // Current heading direction (buffered from nextDirRef)
      const currentDir = nextDirRef.current;
      const head = prevSnake[0];
      let newHead: Position = { ...head };

      switch (currentDir) {
        case 'UP':
          newHead.y -= 1;
          break;
        case 'DOWN':
          newHead.y += 1;
          break;
        case 'LEFT':
          newHead.x -= 1;
          break;
        case 'RIGHT':
          newHead.x += 1;
          break;
      }

      // 1. Wall Collisions check
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        // Trigger game over next cycle, return current snake to prevent crash draw
        setTimeout(() => handleGameOver(), 0);
        return prevSnake;
      }

      // 2. Obstacles Collisions check
      if (obstacles.some((o) => o.x === newHead.x && o.y === newHead.y)) {
        setTimeout(() => handleGameOver(), 0);
        return prevSnake;
      }

      // 3. Self Collisions check
      // Allow eating tail if it's leaving, but simpler & classic is to check all segments
      if (prevSnake.some((s) => s.x === newHead.x && s.y === newHead.y)) {
        setTimeout(() => handleGameOver(), 0);
        return prevSnake;
      }

      // 4. Food Collisions check
      const eatenFoodIdx = foods.findIndex(
        (food) => food.position.x === newHead.x && food.position.y === newHead.y
      );

      const newSnake = [newHead, ...prevSnake];

      if (eatenFoodIdx !== -1) {
        const eatenFood = foods[eatenFoodIdx];

        // Apply score and sound
        const pointsAwarded = eatenFood.type === 'GOLDEN' ? eatenFood.points * 2 : eatenFood.points; // golden gives double or high pts
        setScore((prevScore) => prevScore + pointsAwarded);

        if (eatenFood.type === 'NORMAL') {
          playEatNormal();
        } else {
          playEatSpecial();
        }

        // Particle Burst!
        createExplosion(newHead.x, newHead.y, eatenFood.color);

        // Remove eaten food
        const updatedFoods = foods.filter((_, idx) => idx !== eatenFoodIdx);

        // Power-Up Actions
        if (eatenFood.type === 'SPEEDY') {
          // Spice boost! Make snake super fast but high points
          setSpeedBoostActive(true);
          setSpeedBoostDuration(6); // 6 seconds of lightning speed
        } else if (eatenFood.type === 'SHRINK') {
          // Shield berry! Cut snake size by 2 segments to help player survive
          if (newSnake.length > 5) {
            newSnake.pop();
            newSnake.pop();
          }
        }

        // Keep 1 normal food at all times
        const hasNormalRemaining = updatedFoods.some((f) => f.type === 'NORMAL');
        if (!hasNormalRemaining) {
          const freshNormal = spawnFoodItem('NORMAL', newSnake, obstacles, updatedFoods);
          updatedFoods.push(freshNormal);
        }

        // Spawn a potential special bonus food (25% chance) if no special active/present
        const hasSpecialRemaining = updatedFoods.some((f) => f.type !== 'NORMAL');
        if (!hasSpecialRemaining && Math.random() < 0.25) {
          const types: FoodType[] = ['GOLDEN', 'SPEEDY', 'SHRINK'];
          const chosenType = types[Math.floor(Math.random() * types.length)];
          const specialFood = spawnFoodItem(chosenType, newSnake, obstacles, updatedFoods);
          updatedFoods.push(specialFood);
        }

        setFoods(updatedFoods);
      } else {
        // Move forward, drop the tail segment
        newSnake.pop();
      }

      return newSnake;
    });
  }, [gameState, foods, obstacles, handleGameOver, createExplosion, spawnFoodItem]);

  // Compute active speed tick rate based on difficulty + spicy active boosters
  const currentTickRate = (() => {
    const base = TICK_RATES[difficulty];
    if (speedBoostActive) {
      return Math.floor(base * 0.6); // 40% faster on spice!
    }
    return base;
  })();

  // Core ticking effect
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const timer = setInterval(() => {
      moveSnake();
    }, currentTickRate);

    return () => clearInterval(timer);
  }, [gameState, moveSnake, currentTickRate]);

  // Global Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Space or Enter to pause/unpause or start game
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (gameState === 'IDLE' || gameState === 'GAME_OVER') {
          handleStartGame();
        } else {
          handlePauseGame();
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        if (gameState === 'PLAYING' || gameState === 'PAUSED') {
          handlePauseGame();
        }
        return;
      }

      if (gameState !== 'PLAYING') return;

      switch (key) {
        case 'arrowup':
        case 'w':
        case 'ц':
          e.preventDefault();
          handleDirectionChange('UP');
          break;
        case 'arrowdown':
        case 's':
        case 'ы':
          e.preventDefault();
          handleDirectionChange('DOWN');
          break;
        case 'arrowleft':
        case 'a':
        case 'ф':
          e.preventDefault();
          handleDirectionChange('LEFT');
          break;
        case 'arrowright':
        case 'd':
        case 'в':
          e.preventDefault();
          handleDirectionChange('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleDirectionChange, handlePauseGame, handleStartGame]);

  // Preference Handlers
  const handleToggleMute = () => {
    playClick();
    const muted = toggleMute();
    setIsMuted(muted);
    localStorage.setItem('snake_muted', JSON.stringify(muted));
  };

  const handleToggleGridLines = () => {
    playClick();
    setShowGridLines((prev) => {
      const next = !prev;
      localStorage.setItem('snake_grid_lines', JSON.stringify(next));
      return next;
    });
  };

  const handleToggleObstacles = () => {
    playClick();
    setObstaclesEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('snake_obstacles_enabled', JSON.stringify(next));
      return next;
    });
  };

  const handleClearHistory = () => {
    playClick();
    if (window.confirm('Вы уверены, что хотите сбросить историю рекордов?')) {
      setScoreHistory([]);
      localStorage.removeItem('snake_score_history');
    }
  };

  return (
    <div id="app-root-view" className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col items-center justify-start p-4 md:p-8 antialiased selection:bg-emerald-500/30 select-none relative overflow-hidden">
      {/* Background Neon Aura Glows from Design HTML */}
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container Wrapper */}
      <div className="w-full max-w-5xl flex flex-col gap-6 z-10">
        {/* High impact header inspired by Design HTML */}
        <header id="app-header" className="w-full flex flex-col md:flex-row justify-between items-start md:items-end z-10 border-b-2 border-slate-800/80 pb-5 gap-4">
          <div className="flex flex-col">
            <span className="text-emerald-400 font-black tracking-widest text-[10px] uppercase">Active Session // Игра Змейка</span>
            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white">NEON_SLITHER.v2</h1>
          </div>
          <div className="flex gap-8 w-full md:w-auto justify-between md:justify-end items-center">
            <div className="text-left md:text-right">
              <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Счет</p>
              <p className="text-3xl md:text-4xl font-black text-emerald-400 leading-none mt-1">{score}</p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Рекорд</p>
              <p className="text-3xl md:text-4xl font-black text-purple-400 leading-none mt-1">{highScore}</p>
            </div>
            <div className="flex items-center pl-2">
              <button
                id="header-mute-toggle"
                onClick={handleToggleMute}
                className="p-2.5 rounded-2xl bg-slate-900 border-2 border-slate-800 hover:border-slate-700 transition-colors cursor-pointer text-slate-300 hover:text-emerald-400"
                title={isMuted ? 'Включить звук' : 'Выключить звук'}
              >
                {isMuted ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Warning Alert for Speed boost chilli powerup */}
        <AnimatePresence>
          {speedBoostActive && (
            <motion.div
              id="speed-boost-alert"
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full bg-rose-950/40 border-2 border-rose-800 p-3 rounded-2xl flex items-center justify-between text-rose-300 text-xs md:text-sm font-bold tracking-wide shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-pulse"
            >
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-400 fill-current animate-bounce" />
                <span>Острый перец активен! Скорость движения увеличена в 1.6 раза!</span>
              </div>
              <span className="font-mono bg-rose-900/60 px-2.5 py-0.5 rounded-lg border border-rose-700 text-xs text-white">
                Осталось: {speedBoostDuration}с
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Grid: Game Board on left, Stats & Controls on right */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT AREA: Game Board & Interaction Overlay */}
          <section id="board-section" className="lg:col-span-7 flex flex-col gap-4 relative">
            <div className="relative rounded-[40px] border-4 border-slate-800 p-4 bg-slate-900 shadow-2xl overflow-hidden aspect-square flex items-center justify-center">
              {/* Slate board decorative grid overlay */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)", backgroundSize: "24px 24px" }}></div>
              
              <GameBoard
                snake={snake}
                direction={direction}
                foods={foods}
                obstacles={obstacles}
                gridSize={GRID_SIZE}
                gameState={gameState}
                particles={particles}
                onParticlesUpdate={setParticles}
                showGridLines={showGridLines}
                score={score}
              />

              {/* OVERLAY SCREENS FOR MENU, GAME OVER, PAUSED with theme border */}
              <AnimatePresence>
                {gameState !== 'PLAYING' && (
                  <motion.div
                    id="overlay-screen"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 w-full h-full bg-slate-950/90 backdrop-blur-sm rounded-[36px] flex flex-col items-center justify-center p-6 text-center z-20"
                  >
                    {gameState === 'IDLE' && (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center gap-4 max-w-sm"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                          <Gamepad2 className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-extrabold tracking-tight text-white uppercase italic">
                          Классическая Змейка
                        </h2>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Управляйте змейкой кнопками <strong className="text-slate-200">WASD</strong> или стрелками. Ешьте фрукты, избегайте столкновений со стенами и своим хвостом.
                        </p>
                        <button
                          id="overlay-btn-start"
                          onClick={handleStartGame}
                          className="mt-2 flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.45)] cursor-pointer transition-all hover:scale-105"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          Играть [Пробел]
                        </button>
                      </motion.div>
                    )}

                    {gameState === 'PAUSED' && (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center gap-4"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-400 mb-2 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                          <HelpCircle className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-extrabold tracking-tight text-white uppercase italic">
                          Игра на паузе
                        </h2>
                        <p className="text-xs text-slate-400">
                          Нажмите Пробел или кнопку ниже, чтобы продолжить.
                        </p>
                        <button
                          id="overlay-btn-resume"
                          onClick={handlePauseGame}
                          className="mt-2 flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.45)] cursor-pointer transition-all"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          Продолжить
                        </button>
                      </motion.div>
                    )}

                    {gameState === 'GAME_OVER' && (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center gap-4 max-w-sm"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center text-rose-500 mb-2 shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-bounce">
                          <Trophy className="w-8 h-8 text-rose-500" />
                        </div>
                        <h2 className="text-2xl font-extrabold tracking-tight text-rose-500 uppercase italic">
                          Игра Окончена
                        </h2>
                        <p className="text-xs text-slate-400">
                          Вы врезались во внешнюю стену, преграду или в хвост!
                        </p>
                        <div className="bg-slate-900/80 px-6 py-3 rounded-2xl border-2 border-slate-850 text-sm font-medium flex flex-col gap-1 w-full my-1">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Итоговый счет:</span>
                            <span className="font-extrabold text-emerald-400">{score}</span>
                          </div>
                          {score >= highScore && score > 0 && (
                            <div className="flex justify-center items-center gap-1.5 text-xs text-yellow-400 font-bold mt-1 uppercase tracking-wider animate-pulse">
                              <Sparkles className="w-3.5 h-3.5" />
                              Новый личный рекорд!
                            </div>
                          )}
                        </div>
                        <button
                          id="overlay-btn-replay"
                          onClick={handleStartGame}
                          className="mt-2 flex items-center gap-2 px-8 py-3 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(244,63,94,0.45)] cursor-pointer transition-all hover:scale-105"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Начать заново [Пробел]
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Keyboard Guide */}
            <div className="hidden md:flex justify-center items-center gap-6 py-2.5 px-4 bg-slate-900/60 rounded-2xl border-2 border-slate-800 text-slate-400 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-bold text-slate-300">W/A/S/D</span>
                <span>или</span>
                <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-bold text-slate-300">▲/▼/◀/▶</span>
                <span>— Ход</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800 font-bold text-slate-300">Space</span>
                <span>— Пауза / Рестарт</span>
              </div>
            </div>
          </section>

          {/* RIGHT AREA: Statistics Dashboard & Interactive Controls */}
          <section id="controls-section" className="lg:col-span-5 flex flex-col gap-5 w-full">
            <GameStats
              score={score}
              highScore={highScore}
              snakeLength={snake.length}
              activeFoods={foods}
              difficulty={difficulty}
              scoreHistory={scoreHistory}
              obstaclesEnabled={obstaclesEnabled}
              onClearHistory={handleClearHistory}
            />

            <GameControls
              gameState={gameState}
              difficulty={difficulty}
              obstaclesEnabled={obstaclesEnabled}
              showGridLines={showGridLines}
              isMuted={isMuted}
              onDifficultyChange={setDifficulty}
              onToggleObstacles={handleToggleObstacles}
              onToggleGridLines={handleToggleGridLines}
              onToggleMute={handleToggleMute}
              onStartGame={handleStartGame}
              onPauseGame={handlePauseGame}
              onDirectionChange={handleDirectionChange}
            />
          </section>
        </main>

        {/* Vintage Arcade Detail Footer */}
        <footer className="w-full flex flex-col md:flex-row justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest pt-6 border-t border-slate-900/60 mt-4 gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span>LIVE REGION: LOCAL_ARCADE-01</span>
          </div>
          <div>TurboMode: READY</div>
          <div>Retro Sound Engine: ON</div>
        </footer>
      </div>
    </div>
  );
}
