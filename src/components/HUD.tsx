import React from 'react';
import { motion } from 'motion/react';
import { Brain, Zap, Trophy } from 'lucide-react';

interface HUDProps {
  attentionSpan: number;
  score: number;
  isGameOver: boolean;
  onRestart: () => void;
  tsunamiProximity: number;
  highScore: number;
  onPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({ attentionSpan, score, isGameOver, onRestart, tsunamiProximity, highScore, onPause }) => {
  return (
    <div className="fixed inset-0 pointer-events-none flex flex-col justify-between p-6 font-mono">
      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 bg-[length:100%_2px,3px_100%]" />

      {/* Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{ 
          background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.8) 100%)',
          opacity: Math.max(0, 1 - attentionSpan / 50)
        }}
      />

      {/* Glitch Overlay */}
      {tsunamiProximity > 0.5 && (
        <motion.div 
          className="absolute inset-0 bg-fuchsia-500/10 mix-blend-overlay"
          animate={{ 
            opacity: [0, tsunamiProximity * 0.3, 0],
            x: [0, 10, -10, 0]
          }}
          transition={{ repeat: Infinity, duration: 0.1 }}
        />
      )}

      {/* Top Bar */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <div className="bg-black/50 backdrop-blur-md border border-white/10 p-4 rounded-2xl w-64">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-cyan-400" />
              <span className="text-xs uppercase tracking-widest text-white/70">Attention Span</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-cyan-500 to-fuchsia-500"
                initial={{ width: '100%' }}
                animate={{ width: `${attentionSpan}%` }}
                transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
              />
            </div>
          </div>
          <button 
            onClick={onPause}
            className="bg-black/50 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-[10px] text-white/50 uppercase tracking-widest pointer-events-auto hover:bg-white/10 transition-colors w-fit"
          >
            Pause [ESC]
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <div className="bg-black/50 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-tighter text-white/50">Score</span>
              <span className="text-2xl font-bold text-white tracking-tighter">{Math.floor(score)}</span>
            </div>
            <Trophy className="w-6 h-6 text-yellow-400" />
          </div>
          <div className="bg-black/50 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center justify-between">
            <span className="text-[8px] uppercase tracking-tighter text-white/30">High Score</span>
            <span className="text-xs font-bold text-white/60 tracking-tighter">{Math.floor(highScore)}</span>
          </div>
        </div>
      </div>

      {/* Game Over Overlay */}
      {isGameOver && (
        <div className="absolute inset-0 pointer-events-auto bg-black/90 flex flex-center items-center justify-center z-50 p-8 text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md"
          >
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-500 via-fuchsia-500 to-cyan-500 mb-4 italic uppercase tracking-tighter">
              BRAINROT ASSIMILATED
            </h1>
            <p className="text-white/70 mb-8 text-sm uppercase tracking-widest">
              Your attention span reached 0. You are now optimized for infinite scroll.
            </p>
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl mb-8">
              <div className="text-xs text-white/40 uppercase mb-1">Final Score</div>
              <div className="text-5xl font-bold text-white">{Math.floor(score)}</div>
            </div>
            <button 
              onClick={onRestart}
              className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-cyan-400 transition-colors uppercase tracking-widest"
            >
              Try to Focus Again
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};
