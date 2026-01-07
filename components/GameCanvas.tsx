import React, { useEffect, useRef, useCallback } from 'react';
import { GameState, GameRefs, Particle, Pipe } from '../types';
import { 
  GRAVITY, JUMP_STRENGTH, PIPE_SPEED, PIPE_SPAWN_RATE, 
  PIPE_GAP_SIZE, PIPE_WIDTH, BIRD_SIZE, 
  COLOR_BG_TOP, COLOR_BG_BOTTOM, COLOR_BOOK_GLOW, 
  COLOR_BOOK_PAGE, COLOR_SHELF, COLOR_PARTICLE_BLUE,
  PARTICLE_COUNT_BG 
} from '../utils/constants';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  setScore: (score: number) => void;
  score: number;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, setGameState, setScore, score }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  // Game State Refs (Mutable for performance in loop)
  const game = useRef<GameRefs>({
    score: 0,
    highScore: parseInt(localStorage.getItem('wisdomWings_highScore') || '0'),
    birdY: 300,
    birdVelocity: 0,
    pipes: [],
    particles: [],
    lastTime: 0,
    frameCount: 0
  });

  // --- Particle System ---
  const spawnParticle = (x: number, y: number, type: Particle['type'], count = 1) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 0.5;
      game.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 1.0,
        size: Math.random() * 3 + 1,
        color: type === 'sparkle' ? '#FFF' : COLOR_PARTICLE_BLUE,
        type
      });
    }
  };

  const updateParticles = () => {
    // Background ambient particles
    if (game.current.particles.filter(p => p.type === 'dust').length < PARTICLE_COUNT_BG) {
      if (Math.random() < 0.1) {
        game.current.particles.push({
          x: Math.random() * window.innerWidth,
          y: window.innerHeight + 10,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -Math.random() * 1 - 0.2,
          life: 1,
          maxLife: 1,
          size: Math.random() * 2,
          color: 'rgba(255, 255, 255, 0.2)',
          type: 'dust'
        });
      }
    }

    // Trail
    if (gameState === GameState.PLAYING && game.current.frameCount % 5 === 0) {
      game.current.particles.push({
        x: window.innerWidth / 3 - 10,
        y: game.current.birdY,
        vx: -2,
        vy: (Math.random() - 0.5),
        life: 0.8,
        maxLife: 0.8,
        size: Math.random() * 4 + 2,
        color: COLOR_BOOK_GLOW,
        type: 'trail'
      });
    }

    // Update Logic
    for (let i = game.current.particles.length - 1; i >= 0; i--) {
      const p = game.current.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.015;

      if (p.type === 'dust') {
        if (p.y < -10) p.life = -1; // Kill if off screen top
      }
      
      if (p.life <= 0) {
        game.current.particles.splice(i, 1);
      }
    }
  };

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    game.current.particles.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Glow for sparkles
      if (p.type === 'sparkle' || p.type === 'trail') {
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
      } else {
        ctx.shadowBlur = 0;
      }
    });
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
  };

  // --- Entity Drawing ---
  const drawBird = (ctx: CanvasRenderingContext2D, y: number, rotation: number) => {
    const x = window.innerWidth / 3;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Glow
    ctx.shadowBlur = 25;
    ctx.shadowColor = COLOR_BOOK_GLOW;

    // Book Pages (Left and Right wings)
    const flap = Math.sin(game.current.frameCount * 0.2) * 5;
    
    // Left Page
    ctx.fillStyle = COLOR_BOOK_PAGE;
    ctx.beginPath();
    ctx.moveTo(0, 5); // Spine bottom
    ctx.lineTo(-20, -5 - flap); // Top left corner
    ctx.lineTo(-22, 10 - flap); // Bottom left corner
    ctx.lineTo(0, 15); // Spine bottom 2
    ctx.fill();

    // Right Page
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.lineTo(20, -5 - flap);
    ctx.lineTo(22, 10 - flap);
    ctx.lineTo(0, 15);
    ctx.fill();

    // Cover/Spine
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-2, 5, 4, 12);

    ctx.restore();
  };

  const drawPipes = (ctx: CanvasRenderingContext2D) => {
    ctx.shadowBlur = 0; // Performance: disable shadow for large rects
    
    game.current.pipes.forEach(pipe => {
      // Create a gradient for the shelf to give it depth
      const gradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0);
      gradient.addColorStop(0, '#020617'); // Darker edge (Slate 950)
      gradient.addColorStop(0.1, '#0f172a'); // Main color (Slate 900)
      gradient.addColorStop(0.5, '#1e293b'); // Highlight center (Slate 800)
      gradient.addColorStop(0.9, '#0f172a'); 
      gradient.addColorStop(1, '#020617'); 

      ctx.fillStyle = gradient;

      // Top Pipe
      ctx.fillRect(pipe.x, 0, pipe.width, pipe.gapTop);
      // Shine on edge (right side)
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(pipe.x + pipe.width - 4, 0, 2, pipe.gapTop);
      
      // Reset fill for Bottom Pipe
      ctx.fillStyle = gradient;

      // Bottom Pipe
      const bottomPipeY = pipe.gapTop + pipe.gapHeight;
      const bottomPipeHeight = window.innerHeight - bottomPipeY;
      ctx.fillRect(pipe.x, bottomPipeY, pipe.width, bottomPipeHeight);
      // Shine on edge (right side)
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(pipe.x + pipe.width - 4, bottomPipeY, 2, bottomPipeHeight);
      
      // Shelf detailing (horizontal lines) - Make them subtle
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      for(let y=20; y < pipe.gapTop; y+=40) {
        ctx.fillRect(pipe.x + 4, y, pipe.width - 8, 2);
      }
      for(let y=bottomPipeY + 20; y < window.innerHeight; y+=40) {
        ctx.fillRect(pipe.x + 4, y, pipe.width - 8, 2);
      }
    });
  };

  // --- Physics & Logic ---
  const resetGame = () => {
    game.current.birdY = window.innerHeight / 2;
    game.current.birdVelocity = 0;
    game.current.pipes = [];
    game.current.score = 0;
    game.current.frameCount = 0;
    game.current.particles = [];
    setScore(0);
  };

  const jump = useCallback(() => {
    game.current.birdVelocity = JUMP_STRENGTH;
    // Spawn jump particles
    spawnParticle(window.innerWidth / 3, game.current.birdY + 15, 'trail', 5);
  }, []);

  const gameOver = () => {
    setGameState(GameState.GAME_OVER);
    if (game.current.score > game.current.highScore) {
      game.current.highScore = game.current.score;
      localStorage.setItem('wisdomWings_highScore', game.current.score.toString());
    }
  };

  // --- Main Loop ---
  const loop = useCallback((time: number) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;

    const width = canvasRef.current.width;
    const height = canvasRef.current.height;

    game.current.frameCount++;

    // 1. Clear & Background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, COLOR_BG_TOP);
    gradient.addColorStop(1, COLOR_BG_BOTTOM);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Logic based on state
    if (gameState === GameState.PLAYING) {
      // Bird Physics
      game.current.birdVelocity += GRAVITY;
      game.current.birdY += game.current.birdVelocity;

      // Pipe Spawning
      if (game.current.frameCount % PIPE_SPAWN_RATE === 0) {
        const minGapY = 50;
        const maxGapY = height - PIPE_GAP_SIZE - 50;
        const gapTop = Math.floor(Math.random() * (maxGapY - minGapY + 1)) + minGapY;
        
        game.current.pipes.push({
          x: width,
          width: PIPE_WIDTH,
          gapTop: gapTop,
          gapHeight: PIPE_GAP_SIZE,
          passed: false
        });
      }

      // Pipe Movement & Collision
      for (let i = game.current.pipes.length - 1; i >= 0; i--) {
        const pipe = game.current.pipes[i];
        pipe.x -= PIPE_SPEED;

        // Remove off-screen pipes
        if (pipe.x + pipe.width < 0) {
          game.current.pipes.splice(i, 1);
          continue;
        }

        // Scoring
        if (!pipe.passed && pipe.x + pipe.width < (width / 3)) {
          pipe.passed = true;
          game.current.score += 1;
          setScore(game.current.score);
          spawnParticle(width/3, game.current.birdY, 'sparkle', 10);
        }

        // Collision Check
        const birdLeft = (width / 3) - 15; // Approximate hitboxes
        const birdRight = (width / 3) + 15;
        const birdTop = game.current.birdY - 10;
        const birdBottom = game.current.birdY + 10;

        // Check if bird is within pipe horizontal area
        if (birdRight > pipe.x && birdLeft < pipe.x + pipe.width) {
          // Check if bird hits top pipe or bottom pipe
          if (birdTop < pipe.gapTop || birdBottom > pipe.gapTop + pipe.gapHeight) {
            gameOver();
          }
        }
      }

      // Floor/Ceiling Collision
      if (game.current.birdY > height - 10 || game.current.birdY < 0) {
        gameOver();
      }
    } else if (gameState === GameState.START) {
      // Hover effect
      game.current.birdY = height / 2 + Math.sin(time * 0.003) * 20;
    }

    // 3. Draw Elements
    updateParticles();
    drawPipes(ctx);
    drawParticles(ctx);

    // Bird Rotation
    let rotation = 0;
    if (gameState === GameState.PLAYING) {
      rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (game.current.birdVelocity * 0.1)));
    }
    
    // Draw Bird
    drawBird(ctx, game.current.birdY, rotation);

    requestRef.current = requestAnimationFrame(loop);
  }, [gameState, setGameState, setScore, spawnParticle]);

  // --- Effect Hooks ---
  
  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Game Loop starter
  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [loop]);

  // State reset on mount/gameover
  useEffect(() => {
    if (gameState === GameState.START) {
      resetGame();
    }
  }, [gameState]);

  // Input Listeners
  useEffect(() => {
    const handleInput = (e: Event) => {
      if (gameState === GameState.PLAYING) {
        e.preventDefault(); // Prevent scrolling on spacebar/touch
        jump();
      } else if (gameState === GameState.START || gameState === GameState.GAME_OVER) {
         // UI handles clicks for state transition, but prevents double firing here
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        handleInput(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleInput, { passive: false });
    window.addEventListener('mousedown', handleInput);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleInput);
      window.removeEventListener('mousedown', handleInput);
    };
  }, [gameState, jump]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full block z-0"
    />
  );
};

export default GameCanvas;