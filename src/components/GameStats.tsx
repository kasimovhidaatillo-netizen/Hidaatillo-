import { Trophy, Award, Flame, Shield, Sparkles, Timer, History, Zap } from 'lucide-react';
import { Difficulty, FoodItem, ScoreRecord } from '../types';

interface GameStatsProps {
  score: number;
  highScore: number;
  snakeLength: number;
  activeFoods: FoodItem[];
  difficulty: Difficulty;
  scoreHistory: ScoreRecord[];
  obstaclesEnabled: boolean;
  onClearHistory: () => void;
}

export default function GameStats({
  score,
  highScore,
  snakeLength,
  activeFoods,
  difficulty,
  scoreHistory,
  obstaclesEnabled,
  onClearHistory,
}: GameStatsProps) {
  // Check if any special food is on the board
  const specialFoods = activeFoods.filter((f) => f.type !== 'NORMAL');

  const diffLabels: Record<Difficulty, string> = {
    EASY: 'Легко',
    MEDIUM: 'Норма',
    HARD: 'Сложно',
    EXPERT: 'Эксперт',
  };

  // Vibrant Palette derived stats
  const level = Math.floor(score / 5) + 1;
  const progressToNextLevel = ((score % 5) / 5) * 100;
  
  const baseMultiplier = difficulty === 'EASY' ? 1.0 : difficulty === 'MEDIUM' ? 1.5 : difficulty === 'HARD' ? 2.2 : 3.0;
  const speedBoostMultiplier = activeFoods.some(f => f.type === 'SPEEDY') ? 1.5 : 1.0;
  const totalMultiplier = (baseMultiplier * speedBoostMultiplier).toFixed(2);

  const objectiveText = `Съешьте еще ${5 - (score % 5)} фруктов до уровня ${level + 1}`;

  return (
    <div id="game-stats-panel" className="flex flex-col gap-4 w-full bg-slate-900/80 border-2 border-slate-800 p-5 rounded-3xl backdrop-blur-md shadow-2xl text-slate-200">
      
      {/* Derived Level, Multiplier and Objective Stats from Design HTML */}
      <div className="grid grid-cols-3 gap-3">
        {/* Level card */}
        <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60 flex flex-col justify-between">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider mb-1">Уровень</p>
            <p className="text-xl font-black text-white">{level.toString().padStart(2, '0')}</p>
          </div>
          <div className="w-full bg-slate-850 h-1.5 mt-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-300" 
              style={{ width: `${Math.max(10, progressToNextLevel)}%` }}
            />
          </div>
        </div>

        {/* Multiplier card */}
        <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60 flex flex-col justify-between">
          <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider mb-1">Множитель</p>
          <p className="text-xl font-black text-pink-500">x{totalMultiplier}</p>
        </div>

        {/* Objective card */}
        <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60 flex flex-col justify-between">
          <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider mb-1">Цель</p>
          <p className="text-[10px] font-bold text-slate-300 leading-tight">{objectiveText}</p>
        </div>
      </div>

      {/* Snake Specs Status Bar */}
      <div className="flex justify-between items-center bg-slate-950/40 px-4 py-2 rounded-xl border border-slate-800/40 text-xs">
        <span className="text-slate-400 font-medium flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          Длина змейки:
        </span>
        <span className="font-bold text-sky-400 text-sm bg-sky-950/40 px-2.5 py-0.5 rounded-md border border-sky-900/50">
          {snakeLength}
        </span>
      </div>

      {/* Active Power-up or Special Items on the Board */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Особая еда на карте
        </span>
        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60 min-h-[56px] flex flex-col justify-center">
          {specialFoods.length === 0 ? (
            <span className="text-xs text-slate-500 text-center italic">
              Только обычные яблоки. Особые появляются случайно!
            </span>
          ) : (
            <div className="flex flex-col gap-2">
              {specialFoods.map((food, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-slate-900/60 p-1.5 rounded-lg border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    {food.type === 'GOLDEN' && <Trophy className="w-3.5 h-3.5 text-yellow-400" />}
                    {food.type === 'SPEEDY' && <Flame className="w-3.5 h-3.5 text-rose-500" />}
                    {food.type === 'SHRINK' && <Shield className="w-3.5 h-3.5 text-blue-400" />}
                    <span className="font-medium text-slate-200">
                      {food.type === 'GOLDEN' && 'Золотой фрукт (+3)'}
                      {food.type === 'SPEEDY' && 'Острый перец (+2)'}
                      {food.type === 'SHRINK' && 'Черника-Щит (+1)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded">
                    <Timer className="w-3 h-3 text-amber-500" />
                    <span>Исчезнет!</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Score History List */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-purple-400" />
            История рекордов
          </span>
          {scoreHistory.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer bg-transparent border-none p-0 underline font-medium"
            >
              Сбросить
            </button>
          )}
        </div>

        <div className="bg-slate-950/50 rounded-xl border border-slate-800/60 overflow-hidden max-h-[120px] overflow-y-auto">
          {scoreHistory.length === 0 ? (
            <div className="text-xs text-slate-500 text-center py-6 italic">
              Рекордов пока нет. Начните играть!
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/80 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-2 px-3">Дата</th>
                  <th className="py-2 px-3">Сложность</th>
                  <th className="py-2 px-3">Преграды</th>
                  <th className="py-2 px-3 text-right">Счет</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {scoreHistory.map((rec, index) => (
                  <tr key={index} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-2 px-3 text-slate-400 font-mono text-[10px]">
                      {rec.date}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-300">
                      {diffLabels[rec.difficulty]}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        rec.obstacles
                          ? 'bg-amber-950/30 text-amber-400 border border-amber-900/40'
                          : 'bg-slate-900 text-slate-500'
                      }`}>
                        {rec.obstacles ? 'Да' : 'Нет'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-extrabold text-emerald-400">
                      {rec.score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
