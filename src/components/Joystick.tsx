import React, { useState, useRef, useEffect } from 'react';

interface JoystickProps {
  onMove: (x: number, y: number) => void;
  onEnd: () => void;
}

export const Joystick: React.FC<JoystickProps> = ({ onMove, onEnd }) => {
  const [touchPos, setTouchPos] = useState<{ x: number, y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const baseSize = 120;
  const stickSize = 60;

  const handleTouch = (e: React.TouchEvent | React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;

    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = baseSize / 2;

    if (distance > maxRadius) {
      dx = (dx / distance) * maxRadius;
      dy = (dy / distance) * maxRadius;
    }

    setTouchPos({ x: dx, y: dy });
    onMove(dx / maxRadius, -dy / maxRadius);
  };

  const handleEnd = () => {
    setTouchPos(null);
    onEnd();
  };

  return (
    <div 
      ref={containerRef}
      className="relative pointer-events-auto"
      style={{ width: baseSize, height: baseSize }}
      onTouchMove={handleTouch}
      onTouchStart={handleTouch}
      onTouchEnd={handleEnd}
      onMouseMove={(e) => e.buttons === 1 && handleTouch(e)}
      onMouseDown={handleTouch}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
    >
      <div className="absolute inset-0 bg-white/10 rounded-full border border-white/20 backdrop-blur-sm" />
      <div 
        className="absolute bg-white/40 rounded-full shadow-xl transition-transform duration-75"
        style={{ 
          width: stickSize, 
          height: stickSize,
          left: baseSize / 2 - stickSize / 2 + (touchPos?.x || 0),
          top: baseSize / 2 - stickSize / 2 + (touchPos?.y || 0),
        }}
      />
    </div>
  );
};
