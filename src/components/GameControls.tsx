import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Volume2, VolumeX, Grid, EyeOff, ShieldAlert, Sparkles, Play, Pause, RotateCcw } from 'lucide-react';
import { Difficulty, GameState, Direction } from '../types';

interface GameControlsProps {
  gameState: GameState;
  difficulty: Difficulty;
  obstaclesEnabled: boolean;
  showGridLines: boolean;
  isMuted: boolean;
  onDifficultyChange: (diff: Difficulty) => void;
  onToggleObstacles: () => void;
  onToggleGridLines: () => void;
  onToggleMute: () => void;
  onStartGame: () => void;
  onPauseGame: () => void;
  onDirectionChange: (dir: Direction) => void;
}

export default function GameControls({
  gameState,
  difficulty,
  obstaclesEnabled,
  showGridLines,
  isMuted,
  onDifficultyChange,
  onToggleObstacles,
  onToggleGridLines,
  onToggleMute,
  onStartGame,
  onPauseGame,
  onDirectionChange,
}: GameControlsProps) {
  const difficulties: Difficulty[] = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'];

  const diffLabels: Record<Difficulty, { label: string; color: string }> = {
    EASY: { label: 'Легко', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800' },
    MEDIUM: { label: 'Норма', color: 'text-sky-400 bg-sky-950/40 border-sky-800' },
    HARD: { label: 'Сложно', color: 'text-orange-400 bg-orange-950/40 border-orange-800' },
    EXPERT: { label: 'Эксперт', color: 'text-rose-400 bg-rose-950/40 border-rose-800' },
  };

  return (
    <div id="game-controls-panel" className="flex flex-col gap-5 w-full bg-slate-900/80 border-2 border-slate-800 p-5 rounded-3xl backdrop-blur-md shadow-2xl">
      {/* Playback Buttons */}
      <div className="flex gap-3 justify-center">
        {gameState === 'IDLE' && (
          <button
            id="btn-start"
            onClick={onStartGame}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all cursor-pointer w-full justify-center text-sm uppercase tracking-wider"
          >
            <Play className="w-4.5 h-4.5 fill-current" />
            Начать игру
          </button>
        )}

        {gameState === 'PLAYING' && (
          <button
            id="btn-pause"
            onClick={onPauseGame}
            className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold rounded-2xl shadow-[0_0_15px_rgba(217,119,6,0.4)] transition-all cursor-pointer w-full justify-center text-sm uppercase tracking-wider"
          >
            <Pause className="w-4.5 h-4.5 fill-current" />
            Пауза
          </button>
        )}

        {gameState === 'PAUSED' && (
          <button
            id="btn-resume"
            onClick={onPauseGame}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all cursor-pointer w-full justify-center text-sm uppercase tracking-wider"
          >
            <Play className="w-4.5 h-4.5 fill-current" />
            Продолжить
          </button>
        )}

        {gameState === 'GAME_OVER' && (
          <button
            id="btn-replay"
            onClick={onStartGame}
            className="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold rounded-2xl shadow-[0_0_15px_rgba(225,29,72,0.4)] transition-all cursor-pointer w-full justify-center text-sm uppercase tracking-wider"
          >
            <RotateCcw className="w-4.5 h-4.5" />
            Играть снова
          </button>
        )}
      </div>

      {/* Utility Toolbar */}
      <div className="grid grid-cols-3 gap-2">
        <button
          id="btn-toggle-mute"
          onClick={onToggleMute}
          className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 text-[10px] gap-1 font-bold uppercase tracking-wider transition-all cursor-pointer ${
            isMuted
              ? 'bg-slate-950/40 text-slate-400 border-slate-800 hover:bg-slate-900'
              : 'bg-emerald-950/20 text-emerald-400 border-emerald-900/50 hover:bg-emerald-950/40'
          }`}
          title={isMuted ? 'Включить звук' : 'Выключить звук'}
        >
          {isMuted ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
          <span>{isMuted ? 'Без звука' : 'Звук'}</span>
        </button>

        <button
          id="btn-toggle-grid"
          onClick={onToggleGridLines}
          className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 text-[10px] gap-1 font-bold uppercase tracking-wider transition-all cursor-pointer ${
            showGridLines
              ? 'bg-sky-950/20 text-sky-400 border-sky-900/50 hover:bg-sky-950/40'
              : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:bg-slate-900'
          }`}
          title="Вкл/Выкл сетку"
        >
          {showGridLines ? <Grid className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
          <span>Сетка</span>
        </button>

        <button
          id="btn-toggle-obstacles"
          disabled={gameState === 'PLAYING'}
          onClick={onToggleObstacles}
          className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 text-[10px] gap-1 font-bold uppercase tracking-wider transition-all cursor-pointer ${
            gameState === 'PLAYING' ? 'opacity-40 cursor-not-allowed' : ''
          } ${
            obstaclesEnabled
              ? 'bg-orange-950/20 text-orange-400 border-orange-900/50 hover:bg-orange-950/40'
              : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:bg-slate-900'
          }`}
          title="Стены-препятствия на карте"
        >
          <ShieldAlert className="w-4.5 h-4.5" />
          <span>Преграды</span>
        </button>
      </div>

      {/* Difficulty Setting */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          Сложность / Скорость
        </label>
        <div className="grid grid-cols-4 gap-1.5 bg-slate-950/50 p-1 rounded-2xl border-2 border-slate-800">
          {difficulties.map((diff) => (
            <button
              id={`btn-diff-${diff}`}
              key={diff}
              disabled={gameState === 'PLAYING'}
              onClick={() => onDifficultyChange(diff)}
              className={`py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                gameState === 'PLAYING' ? 'opacity-45 cursor-not-allowed' : ''
              } ${
                difficulty === diff
                  ? `${diffLabels[diff].color} border shadow-inner`
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              {diffLabels[diff].label}
            </button>
          ))}
        </div>
      </div>

      {/* Virtual D-Pad for Mobile/Touch Users */}
      <div className="flex flex-col items-center gap-2 mt-2">
        <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase">
          Виртуальный Джойстик
        </span>
        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Central Core Decorative circle */}
          <div className="absolute w-12 h-12 rounded-full bg-slate-950 border-2 border-slate-800 shadow-lg flex items-center justify-center z-10 pointer-events-none">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          </div>

          {/* D-Pad Buttons in Vintage Arcade Thick Border style from Design HTML */}
          <button
            id="dpad-up"
            onClick={() => onDirectionChange('UP')}
            className="absolute top-0 w-12 h-12 flex items-center justify-center bg-slate-850 hover:bg-slate-800 active:bg-emerald-500 text-slate-200 active:text-slate-900 rounded-xl border-b-4 border-slate-950 font-bold text-xl cursor-pointer transition-all shadow-md active:scale-95"
            title="Вверх"
          >
            <ArrowUp className="w-6 h-6" />
          </button>

          <button
            id="dpad-left"
            onClick={() => onDirectionChange('LEFT')}
            className="absolute left-0 w-12 h-12 flex items-center justify-center bg-slate-850 hover:bg-slate-800 active:bg-emerald-500 text-slate-200 active:text-slate-900 rounded-xl border-b-4 border-slate-950 font-bold text-xl cursor-pointer transition-all shadow-md active:scale-95"
            title="Влево"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <button
            id="dpad-right"
            onClick={() => onDirectionChange('RIGHT')}
            className="absolute right-0 w-12 h-12 flex items-center justify-center bg-slate-850 hover:bg-slate-800 active:bg-emerald-500 text-slate-200 active:text-slate-900 rounded-xl border-b-4 border-slate-950 font-bold text-xl cursor-pointer transition-all shadow-md active:scale-95"
            title="Вправо"
          >
            <ArrowRight className="w-6 h-6" />
          </button>

          <button
            id="dpad-down"
            onClick={() => onDirectionChange('DOWN')}
            className="absolute bottom-0 w-12 h-12 flex items-center justify-center bg-slate-850 hover:bg-slate-800 active:bg-emerald-500 text-slate-200 active:text-slate-900 rounded-xl border-b-4 border-slate-950 font-bold text-xl cursor-pointer transition-all shadow-md active:scale-95"
            title="Вниз"
          >
            <ArrowDown className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
