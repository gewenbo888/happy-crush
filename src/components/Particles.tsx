"use client";

import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";

export interface ParticlesHandle {
  burst: (x: number, y: number, opts?: { count?: number; color?: string; force?: number; emoji?: string }) => void;
  confetti: () => void;
  shockwave: (x: number, y: number) => void;
}

type P =
  | {
      kind: "dot";
      x: number; y: number; vx: number; vy: number;
      r: number; life: number; max: number; color: string;
    }
  | {
      kind: "emoji";
      x: number; y: number; vx: number; vy: number;
      rot: number; vr: number; size: number;
      life: number; max: number; emoji: string;
    }
  | {
      kind: "shock";
      x: number; y: number; r: number; life: number; max: number;
    };

const Particles = forwardRef<ParticlesHandle>(function Particles(_, ref) {
  const cvs = useRef<HTMLCanvasElement>(null);
  const particles = useRef<P[]>([]);
  const raf = useRef(0);

  useEffect(() => {
    const c = cvs.current!;
    const ctx = c.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      c.width = c.clientWidth * dpr;
      c.height = c.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);

    const tick = () => {
      ctx.clearRect(0, 0, c.clientWidth, c.clientHeight);
      const list = particles.current;
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        if (p.kind === "shock") {
          p.r += 8;
          p.life++;
          const a = Math.max(0, 1 - p.life / p.max);
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255,225,122,${a * 0.85})`;
          ctx.lineWidth = 5 * a + 1;
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255,255,255,${a * 0.6})`;
          ctx.lineWidth = 2 * a + 0.5;
          ctx.arc(p.x, p.y, p.r * 0.7, 0, Math.PI * 2);
          ctx.stroke();
          if (p.life >= p.max) list.splice(i, 1);
          continue;
        }
        p.life++;
        p.vy += 0.32;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.985;
        const a = Math.max(0, 1 - p.life / p.max);
        if (p.kind === "dot") {
          ctx.beginPath();
          ctx.fillStyle = p.color;
          ctx.globalAlpha = a;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 12;
          ctx.arc(p.x, p.y, p.r * (0.4 + a * 0.6), 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        } else {
          p.rot += p.vr;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.globalAlpha = a;
          ctx.font = `${p.size}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(p.emoji, 0, 0);
          ctx.globalAlpha = 1;
          ctx.restore();
        }
        if (p.life >= p.max) list.splice(i, 1);
      }
      raf.current = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf.current);
      ro.disconnect();
    };
  }, []);

  useImperativeHandle(ref, () => ({
    burst(x, y, opts) {
      const c = cvs.current!;
      const rect = c.getBoundingClientRect();
      const px = x - rect.left;
      const py = y - rect.top;
      const count = opts?.count ?? 18;
      const color = opts?.color ?? "rgba(255, 225, 122, 1)";
      const force = opts?.force ?? 5;
      const emoji = opts?.emoji;
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = force * (0.5 + Math.random() * 0.9);
        if (emoji) {
          particles.current.push({
            kind: "emoji",
            x: px, y: py,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s - 1.5,
            rot: 0,
            vr: (Math.random() - 0.5) * 0.4,
            size: 12 + Math.random() * 16,
            life: 0,
            max: 38 + Math.random() * 18,
            emoji,
          });
        } else {
          particles.current.push({
            kind: "dot",
            x: px, y: py,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s - 1.2,
            r: 3 + Math.random() * 4,
            life: 0,
            max: 28 + Math.random() * 16,
            color,
          });
        }
      }
    },
    shockwave(x, y) {
      const c = cvs.current!;
      const rect = c.getBoundingClientRect();
      particles.current.push({
        kind: "shock",
        x: x - rect.left,
        y: y - rect.top,
        r: 8,
        life: 0,
        max: 28,
      });
    },
    confetti() {
      const c = cvs.current!;
      const w = c.clientWidth;
      const palette = ["#ff5d6d","#ff9d57","#ffe17a","#a8f5e2","#7be8ff","#c79bff","#ff85c1"];
      for (let i = 0; i < 140; i++) {
        particles.current.push({
          kind: "dot",
          x: Math.random() * w,
          y: -10 - Math.random() * 100,
          vx: (Math.random() - 0.5) * 4,
          vy: 2 + Math.random() * 4,
          r: 3 + Math.random() * 4,
          life: 0,
          max: 120 + Math.random() * 60,
          color: palette[i % palette.length],
        });
      }
    },
  }));

  return (
    <canvas
      ref={cvs}
      className="pointer-events-none absolute inset-0 w-full h-full z-20"
      aria-hidden
    />
  );
});

export default Particles;
