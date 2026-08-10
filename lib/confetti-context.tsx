"use client";

import { createContext, useCallback, useContext, useEffect, useRef } from "react";

type Piece = {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
  rot: number;
  rotSpeed: number;
  color: string;
  drift: number;
};

type ConfettiContextValue = { burst: () => void };

const ConfettiContext = createContext<ConfettiContextValue | null>(null);

export function useConfetti() {
  const ctx = useContext(ConfettiContext);
  if (!ctx) throw new Error("useConfetti must be used within a ConfettiProvider");
  return ctx;
}

export function ConfettiProvider({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const burst = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ["#043C40", "#0E6B73", "#C49850", "#189267", "#E85D5A"];
    let pieces: Piece[] = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.3,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      speed: 2 + Math.random() * 3,
      rot: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      drift: (Math.random() - 0.5) * 2,
    }));
    let frame = 0;
    function tick() {
      frame++;
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      pieces.forEach((p) => {
        p.y += p.speed;
        p.x += p.drift;
        p.rot += p.rotSpeed;
        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.rot * Math.PI) / 180);
        ctx!.fillStyle = p.color;
        ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx!.restore();
      });
      pieces = pieces.filter((p) => p.y < canvas!.height + 30);
      if (frame < 220 && pieces.length > 0) {
        requestAnimationFrame(tick);
      } else {
        ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      }
    }
    tick();
  }, []);

  return (
    <ConfettiContext.Provider value={{ burst }}>
      {children}
      <canvas id="confetti-canvas" ref={canvasRef} />
    </ConfettiContext.Provider>
  );
}
