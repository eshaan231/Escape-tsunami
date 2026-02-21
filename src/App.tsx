/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion } from 'motion/react';
import { GameEngine } from './game/GameEngine';
import { Player } from './game/Player';
import { World } from './game/World';
import { Tsunami } from './game/Tsunami';
import { HUD } from './components/HUD';
import { Joystick } from './components/Joystick';
import { PlayerControls, GameState } from './types';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const playerRef = useRef<Player | null>(null);
  const worldRef = useRef<World | null>(null);
  const tsunamiRef = useRef<Tsunami | null>(null);
  
  const [gameState, setGameState] = useState<GameState & { isStarted: boolean }>({
    score: 0,
    attentionSpan: 100,
    isGameOver: false,
    distance: 0,
    isPaused: false,
    isStarted: false,
  });

  const [controls, setControls] = useState<PlayerControls>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    lookX: 0,
    lookY: 0,
  });

  const controlsRef = useRef(controls);
  useEffect(() => {
    controlsRef.current = controls;
  }, [controls]);

  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new GameEngine(containerRef.current, (delta) => {
      if (gameStateRef.current.isGameOver || gameStateRef.current.isPaused || !gameStateRef.current.isStarted) return;
      update(delta);
    });
    engineRef.current = engine;

    const player = new Player(engine.scene);
    playerRef.current = player;

    const world = new World(engine.scene);
    worldRef.current = world;

    const tsunami = new Tsunami(engine.scene);
    tsunamiRef.current = tsunami;

    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': setControls(prev => ({ ...prev, forward: true })); break;
        case 'KeyS': setControls(prev => ({ ...prev, backward: true })); break;
        case 'KeyA': setControls(prev => ({ ...prev, left: true })); break;
        case 'KeyD': setControls(prev => ({ ...prev, right: true })); break;
        case 'Space': setControls(prev => ({ ...prev, jump: true })); break;
        case 'Escape': setGameState(prev => ({ ...prev, isPaused: !prev.isPaused })); break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': setControls(prev => ({ ...prev, forward: false })); break;
        case 'KeyS': setControls(prev => ({ ...prev, backward: false })); break;
        case 'KeyA': setControls(prev => ({ ...prev, left: false })); break;
        case 'KeyD': setControls(prev => ({ ...prev, right: false })); break;
        case 'Space': setControls(prev => ({ ...prev, jump: false })); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      engine.dispose();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const [lookDelta, setLookDelta] = useState({ x: 0, y: 0 });
  const lastTouchRef = useRef<{ x: number, y: number } | null>(null);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (gameState.isGameOver || !gameState.isStarted) return;
    const touch = e.touches[0];
    if (touch.clientX > window.innerWidth / 2) {
      if (lastTouchRef.current) {
        const dx = touch.clientX - lastTouchRef.current.x;
        const dy = touch.clientY - lastTouchRef.current.y;
        setControls(prev => ({
          ...prev,
          lookX: dx * 0.1, // Reduced sensitivity
          lookY: dy * 0.1,
        }));
      }
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchEnd = () => {
    lastTouchRef.current = null;
    setControls(prev => ({ ...prev, lookX: 0, lookY: 0 }));
  };

  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('brainrot_highscore') || 0));

  useEffect(() => {
    if (gameState.score > highScore) {
      setHighScore(gameState.score);
      localStorage.setItem('brainrot_highscore', String(Math.floor(gameState.score)));
    }
  }, [gameState.score, highScore]);

  const update = (delta: number) => {
    if (!playerRef.current || !worldRef.current || !tsunamiRef.current || !engineRef.current) return;

    const player = playerRef.current;
    const world = worldRef.current;
    const tsunami = tsunamiRef.current;
    const engine = engineRef.current;

    // Update Player
    player.update(delta, controlsRef.current, world.getAllPlatformObjects());

    // Update World
    world.update(player.mesh.position.z);

    // Update Tsunami
    tsunami.update(delta, player.mesh.position.z);

    // Camera follow
    const cameraOffset = new THREE.Vector3(0, 5, 10);
    cameraOffset.applyQuaternion(player.mesh.quaternion);
    engine.camera.position.lerp(player.mesh.position.clone().add(cameraOffset), 0.1);
    engine.camera.lookAt(player.mesh.position);

    // Game Logic
    setGameState(prev => {
      if (prev.isGameOver) return prev;

      let newAttention = Math.max(0, prev.attentionSpan - 3 * delta);
      const newScore = prev.score + Math.abs(player.velocity.z) * delta * 0.1;
      
      // Check shard collection
      const playerPos = player.mesh.position;
      world.platforms.forEach(chunk => {
        chunk.children.forEach(child => {
          if ((child as any).isCollectible) {
            const dist = playerPos.distanceTo(child.getWorldPosition(new THREE.Vector3()));
            if (dist < 2) {
              newAttention = Math.min(100, newAttention + 15);
              chunk.remove(child);
            }
          }
          if ((child as any).isPowerUp) {
            const dist = playerPos.distanceTo(child.getWorldPosition(new THREE.Vector3()));
            if (dist < 2) {
              tsunami.speed = Math.max(2, tsunami.speed - 5);
              chunk.remove(child);
              // Visual feedback: brief screen flash or something
            }
          }
        });
      });

      let isGameOver = newAttention <= 0;
      if (tsunami.checkCollision(player.mesh.position)) {
        isGameOver = true;
      }

      if (player.mesh.position.y < -15) {
        isGameOver = true;
      }

      return {
        ...prev,
        attentionSpan: newAttention,
        score: newScore,
        isGameOver,
        distance: -player.mesh.position.z
      };
    });
  };

  const handleRestart = () => {
    window.location.reload(); // Simplest way to reset the whole Three.js state
  };

  return (
    <div 
      className="w-full h-screen bg-black overflow-hidden touch-none select-none"
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div ref={containerRef} className="w-full h-full" />
      
      <HUD 
        attentionSpan={gameState.attentionSpan} 
        score={gameState.score} 
        isGameOver={gameState.isGameOver}
        onRestart={handleRestart}
        tsunamiProximity={tsunamiRef.current ? Math.max(0, 1 - (playerRef.current?.mesh.position.z! - tsunamiRef.current.mesh.position.z) / 50) : 0}
        highScore={highScore}
        onPause={() => setGameState(prev => ({ ...prev, isPaused: true }))}
      />

      {!gameState.isStarted && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-8 text-center">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="max-w-2xl"
          >
            <h1 className="text-7xl font-black text-white mb-2 italic uppercase tracking-tighter">
              BRAINROT <span className="text-fuchsia-500">TSUNAMI</span>
            </h1>
            <p className="text-white/60 mb-12 text-sm uppercase tracking-[0.3em]">
              Escape the infinite scroll. Preserve your focus.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="text-cyan-400 text-xs font-bold mb-1 uppercase">WASD / Joystick</div>
                <div className="text-white/40 text-[10px] uppercase">To Move</div>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="text-fuchsia-400 text-xs font-bold mb-1 uppercase">Space / Jump</div>
                <div className="text-white/40 text-[10px] uppercase">To Leap</div>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="text-yellow-400 text-xs font-bold mb-1 uppercase">Swipe Right</div>
                <div className="text-white/40 text-[10px] uppercase">To Look</div>
              </div>
            </div>

            <button 
              onClick={() => setGameState(prev => ({ ...prev, isStarted: true }))}
              className="px-12 py-5 bg-white text-black font-black rounded-2xl hover:bg-cyan-400 transition-all hover:scale-105 uppercase tracking-widest text-lg"
            >
              Start Focusing
            </button>
          </motion.div>
        </div>
      )}

      {/* Pause Menu */}
      {gameState.isPaused && !gameState.isGameOver && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
          <div className="text-center">
            <h2 className="text-4xl font-black text-white mb-8 uppercase tracking-widest italic">Paused</h2>
            <button 
              onClick={() => setGameState(prev => ({ ...prev, isPaused: false }))}
              className="px-8 py-4 bg-white text-black font-bold rounded-xl uppercase tracking-widest hover:bg-cyan-400 transition-colors"
            >
              Resume
            </button>
          </div>
        </div>
      )}

      {gameState.isStarted && !gameState.isGameOver && (
        <div className="fixed bottom-12 left-12 right-12 flex justify-between items-end pointer-events-none">
          <Joystick 
            onMove={(x, y) => {
              setControls(prev => ({
                ...prev,
                forward: y > 0.2,
                backward: y < -0.2,
                left: x < -0.2,
                right: x > 0.2,
              }));
            }}
            onEnd={() => {
              setControls(prev => ({
                ...prev,
                forward: false,
                backward: false,
                left: false,
                right: false,
              }));
            }}
          />

          <div className="flex flex-col items-end gap-4">
            <button 
              className="w-20 h-20 bg-white/10 border border-white/20 backdrop-blur-md rounded-full flex items-center justify-center pointer-events-auto active:scale-90 transition-transform"
              onTouchStart={() => setControls(prev => ({ ...prev, jump: true }))}
              onTouchEnd={() => setControls(prev => ({ ...prev, jump: false }))}
              onMouseDown={() => setControls(prev => ({ ...prev, jump: true }))}
              onMouseUp={() => setControls(prev => ({ ...prev, jump: false }))}
            >
              <span className="text-white font-bold uppercase text-xs tracking-widest">Jump</span>
            </button>
          </div>
        </div>
      )}

      {/* Camera Swipe Area */}
      {!gameState.isGameOver && (
        <div 
          className="fixed inset-0 pointer-events-auto z-0"
          style={{ width: '100%', height: '100%', clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)' }}
          onTouchMove={(e) => {
            // Simple swipe to look
            // In a real implementation, we'd track deltas
          }}
        />
      )}
    </div>
  );
}

