import { useEffect, useRef, useState } from 'react';
import { Position, FoodItem, Particle, GameState, Direction } from '../types';

interface GameBoardProps {
  snake: Position[];
  direction: Direction;
  foods: FoodItem[];
  obstacles: Position[];
  gridSize: number;
  gameState: GameState;
  particles: Particle[];
  onParticlesUpdate: (updater: (prev: Particle[]) => Particle[]) => void;
  showGridLines: boolean;
  score: number;
}

export default function GameBoard({
  snake,
  direction,
  foods,
  obstacles,
  gridSize,
  gameState,
  particles,
  onParticlesUpdate,
  showGridLines,
  score,
}: GameBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [boardSize, setBoardSize] = useState(400);
  const animationRef = useRef<number | null>(null);
  const pulseRef = useRef(0);

  // Resize handler to keep canvas responsive and square
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const size = Math.min(width, height, 600); // Max size of 600px
        setBoardSize(size > 280 ? size : 280); // Min size of 280px
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Frame animation loop (for glowing, particles, etc.)
  useEffect(() => {
    const updateAndDraw = () => {
      // 1. Update pulse factor for food glows
      pulseRef.current = (pulseRef.current + 0.05) % (Math.PI * 2);

      // 2. Update particles state
      onParticlesUpdate((prevParticles) => {
        if (prevParticles.length === 0) return prevParticles;
        return prevParticles
          .map((p) => ({
            ...p,
            x: p.x + p.dx,
            y: p.y + p.dy,
            alpha: p.alpha - 0.02,
          }))
          .filter((p) => p.alpha > 0);
      });

      // 3. Trigger canvas draw
      draw();

      animationRef.current = requestAnimationFrame(updateAndDraw);
    };

    animationRef.current = requestAnimationFrame(updateAndDraw);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [snake, foods, obstacles, particles, showGridLines, gameState, boardSize]);

  // Main drawing routine
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = boardSize / gridSize;
    const pulse = Math.sin(pulseRef.current) * 0.15 + 0.85; // oscillates between 0.7 and 1.0

    // Clear Canvas - retro dark background
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, boardSize, boardSize);

    // Draw Subtle Grid Lines (optional toggle)
    if (showGridLines) {
      ctx.strokeStyle = 'rgba(20, 30, 55, 0.5)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= gridSize; i++) {
        // Vertical
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, boardSize);
        ctx.stroke();

        // Horizontal
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(boardSize, i * cellSize);
        ctx.stroke();
      }
    }

    // Draw Obstacles (stones)
    obstacles.forEach((obs) => {
      ctx.fillStyle = '#2d3748';
      ctx.strokeStyle = '#e53e3e';
      ctx.lineWidth = 1.5;

      const x = obs.x * cellSize;
      const y = obs.y * cellSize;
      const pad = cellSize * 0.1;

      // Draw obstacle stone shape
      ctx.beginPath();
      ctx.moveTo(x + pad, y + pad);
      ctx.lineTo(x + cellSize - pad, y + pad);
      ctx.lineTo(x + cellSize - pad, y + cellSize - pad);
      ctx.lineTo(x + pad, y + cellSize - pad);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw warning cross in the middle
      ctx.strokeStyle = 'rgba(229, 62, 62, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + pad * 2, y + pad * 2);
      ctx.lineTo(x + cellSize - pad * 2, y + cellSize - pad * 2);
      ctx.moveTo(x + cellSize - pad * 2, y + pad * 2);
      ctx.lineTo(x + pad * 2, y + cellSize - pad * 2);
      ctx.stroke();
    });

    // Draw Food Items with glow
    foods.forEach((food) => {
      const fx = food.position.x * cellSize + cellSize / 2;
      const fy = food.position.y * cellSize + cellSize / 2;
      const r = (cellSize / 2) * 0.75 * pulse;

      ctx.save();
      ctx.shadowBlur = 12 * pulse;
      ctx.shadowColor = food.glowColor;
      ctx.fillStyle = food.color;

      // Draw depending on food type
      if (food.type === 'NORMAL') {
        // Classic red apple with stem
        ctx.beginPath();
        ctx.arc(fx, fy, r, 0, Math.PI * 2);
        ctx.fill();

        // Green leaf
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fx, fy - r);
        ctx.quadraticCurveTo(fx + r * 0.5, fy - r * 1.3, fx + r * 0.2, fy - r * 1.5);
        ctx.stroke();
      } else if (food.type === 'GOLDEN') {
        // Star or glowing diamond shape
        ctx.beginPath();
        ctx.moveTo(fx, fy - r);
        ctx.lineTo(fx + r, fy);
        ctx.lineTo(fx, fy + r);
        ctx.lineTo(fx - r, fy);
        ctx.closePath();
        ctx.fill();
      } else if (food.type === 'SPEEDY') {
        // Spicy pepper (triangle shape)
        ctx.beginPath();
        ctx.moveTo(fx, fy - r);
        ctx.quadraticCurveTo(fx + r * 0.8, fy + r * 0.2, fx, fy + r);
        ctx.quadraticCurveTo(fx - r * 0.8, fy + r * 0.2, fx, fy - r);
        ctx.closePath();
        ctx.fill();

        // Little green cap
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(fx, fy - r * 0.8, r * 0.3, 0, Math.PI * 2);
        ctx.fill();
      } else if (food.type === 'SHRINK') {
        // Blueberry shield with outer ring
        ctx.beginPath();
        ctx.arc(fx, fy, r * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Outer circular ring
        ctx.strokeStyle = food.glowColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(fx, fy, r * 1.2, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    });

    // Draw Particles
    particles.forEach((p) => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.shadowBlur = 4;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw Snake
    if (snake.length > 0) {
      snake.forEach((segment, idx) => {
        const isHead = idx === 0;
        const isTail = idx === snake.length - 1;

        const x = segment.x * cellSize;
        const y = segment.y * cellSize;
        const radius = cellSize * 0.45; // slightly smaller than half cell for padding

        ctx.save();

        // Gradient color from head to tail
        const progress = idx / Math.max(1, snake.length - 1);
        
        // Head: bright green neon. Tail: darker cyan neon
        if (isHead) {
          ctx.fillStyle = '#22c55e'; // Emerald-500
          ctx.shadowBlur = 10;
          ctx.shadowColor = 'rgba(34, 197, 94, 0.8)';
        } else {
          // Color transition
          ctx.fillStyle = `rgb(${Math.floor(34 - progress * 15)}, ${Math.floor(197 - progress * 80)}, ${Math.floor(94 + progress * 80)})`; // fading green to teal/cyan
        }

        // Draw segments as nice rounded capsules
        ctx.beginPath();
        
        // Get surrounding segments to round nicely
        if (isHead) {
          // Draw rounded head towards moving direction
          ctx.arc(x + cellSize / 2, y + cellSize / 2, radius, 0, Math.PI * 2);
          ctx.fill();

          // Draw Head details (Eyes!)
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 0; // turn off glow for eyes

          const eyeSize = cellSize * 0.15;
          const pupilSize = cellSize * 0.08;
          let leftEye = { x: 0, y: 0 };
          let rightEye = { x: 0, y: 0 };

          // Position eyes according to direction of movement
          if (direction === 'UP') {
            leftEye = { x: x + cellSize * 0.3, y: y + cellSize * 0.3 };
            rightEye = { x: x + cellSize * 0.7, y: y + cellSize * 0.3 };
          } else if (direction === 'DOWN') {
            leftEye = { x: x + cellSize * 0.3, y: y + cellSize * 0.7 };
            rightEye = { x: x + cellSize * 0.7, y: y + cellSize * 0.7 };
          } else if (direction === 'LEFT') {
            leftEye = { x: x + cellSize * 0.3, y: y + cellSize * 0.3 };
            rightEye = { x: x + cellSize * 0.3, y: y + cellSize * 0.7 };
          } else if (direction === 'RIGHT') {
            leftEye = { x: x + cellSize * 0.7, y: y + cellSize * 0.3 };
            rightEye = { x: x + cellSize * 0.7, y: y + cellSize * 0.7 };
          }

          // Draw white eyes
          ctx.beginPath();
          ctx.arc(leftEye.x, leftEye.y, eyeSize, 0, Math.PI * 2);
          ctx.arc(rightEye.x, rightEye.y, eyeSize, 0, Math.PI * 2);
          ctx.fill();

          // Draw black pupils looking forward
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(leftEye.x, leftEye.y, pupilSize, 0, Math.PI * 2);
          ctx.arc(rightEye.x, rightEye.y, pupilSize, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Body segments - rounded squares or interconnected capsules
          const pad = cellSize * 0.08;
          ctx.roundRect(x + pad, y + pad, cellSize - pad * 2, cellSize - pad * 2, cellSize * 0.2);
          ctx.fill();
        }

        ctx.restore();
      });
    }

    // Border Frame Accent Glow based on state
    ctx.strokeStyle =
      gameState === 'GAME_OVER'
        ? '#ef4444'
        : gameState === 'PAUSED'
        ? '#eab308'
        : 'rgba(34, 197, 94, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, boardSize, boardSize);
  };

  return (
    <div
      id="game-board-container"
      ref={containerRef}
      className="relative w-full aspect-square max-w-[550px] mx-auto rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center p-1 shadow-[0_0_25px_rgba(15,23,42,0.6)]"
    >
      <canvas
        id="game-canvas"
        ref={canvasRef}
        width={boardSize}
        height={boardSize}
        className="block rounded-lg shadow-inner cursor-pointer"
      />
    </div>
  );
}
