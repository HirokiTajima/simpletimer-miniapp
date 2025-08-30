'use client'

import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export default function SimpleTimer() {
  const [setupSec, setSetupSec] = useState<number>(3 * 60);
  const [remainingSec, setRemainingSec] = useState<number>(setupSec);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [alarming, setAlarming] = useState(false);
  const endAtRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);

  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const alarmIntervalRef = useRef<number | null>(null);

  const format = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!running) {
      setRemainingSec(setupSec);
      return;
    }
  }, [setupSec, running]);

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      stopAlarm();
    };
  }, []);

  const ensureAudio = async () => {
    let ctx = audioCtx;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      setAudioCtx(ctx);
    }
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {}
    }
    return ctx;
  };

  const playBeep = (ctx: AudioContext) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine'; // softer tone
    osc.frequency.setValueAtTime(1200, ctx.currentTime);

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  };

  const playAlarm = async () => {
    const ctx = await ensureAudio();
    if (!ctx) return;

    setAlarming(true);

    alarmIntervalRef.current = window.setInterval(() => {
      playBeep(ctx);
    }, 100); // very short interval for continuous beeps
  };

  const stopAlarm = () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    setAlarming(false);
  };

  const start = async () => {
    if (setupSec <= 0) return;
    await ensureAudio();
    setRunning(true);
    setPaused(false);
    const endAt = Date.now() + remainingSec * 1000;
    endAtRef.current = endAt;

    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => {
      if (!endAtRef.current) return;
      const leftMs = Math.max(0, endAtRef.current - Date.now());
      const left = Math.round(leftMs / 1000);
      setRemainingSec(left);
      if (left <= 0) {
        clearInterval(tickRef.current!);
        endAtRef.current = null;
        setRunning(false);
        setPaused(false);
        playAlarm();
      }
    }, 200);
  };

  const pause = () => {
    if (!running) return;
    setPaused(true);
    setRunning(false);
    if (endAtRef.current) {
      const leftMs = Math.max(0, endAtRef.current - Date.now());
      setRemainingSec(Math.round(leftMs / 1000));
    }
    endAtRef.current = null;
    if (tickRef.current) clearInterval(tickRef.current);
  };

  const resume = () => {
    if (!paused) return;
    setRunning(true);
    setPaused(false);
    const endAt = Date.now() + remainingSec * 1000;
    endAtRef.current = endAt;

    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => {
      if (!endAtRef.current) return;
      const leftMs = Math.max(0, endAtRef.current - Date.now());
      const left = Math.round(leftMs / 1000);
      setRemainingSec(left);
      if (left <= 0) {
        clearInterval(tickRef.current!);
        endAtRef.current = null;
        setRunning(false);
        setPaused(false);
        playAlarm();
      }
    }, 200);
  };

  const reset = () => {
    setRunning(false);
    setPaused(false);
    endAtRef.current = null;
    if (tickRef.current) clearInterval(tickRef.current);
    setRemainingSec(setupSec);
    stopAlarm();
  };

  const adjust = (delta: number) => {
    if (running) return;
    const next = Math.max(0, Math.min(12 * 3600, setupSec + delta));
    setSetupSec(next);
    setRemainingSec(next);
  };

  const setPreset = (min: number) => {
    if (running) return;
    const s = Math.max(0, Math.min(12 * 3600, min * 60));
    setSetupSec(s);
    setRemainingSec(s);
  };

  const displaySec = running || paused ? remainingSec : setupSec;
  const mm = Math.floor(displaySec / 60);
  const ss = displaySec % 60;

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-black text-white px-6 py-6">
      <header className="mt-2">
        <h1 className="text-2xl font-bold tracking-wide">SimpleTimer</h1>
      </header>

      <main className="w-full max-w-md flex flex-col items-center">
        <div className="w-full rounded-2xl bg-zinc-900 p-6 shadow-lg flex flex-col items-center">
          <div className="text-[64px] leading-none font-mono tabular-nums select-none">
            {String(mm).padStart(2, '0')}
            <span className="opacity-60">:</span>
            {String(ss).padStart(2, '0')}
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2 w-full">
            <button onClick={() => adjust(-60)} disabled={running} className="btn">-1m</button>
            <button onClick={() => adjust(-10)} disabled={running} className="btn">-10s</button>
            <button onClick={() => adjust(10)} disabled={running} className="btn">+10s</button>
            <button onClick={() => adjust(60)} disabled={running} className="btn">+1m</button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 justify-center">
            {[1, 3, 5, 10, 25].map((m) => (
              <button key={m} onClick={() => setPreset(m)} disabled={running} className="chip">{m}m</button>
            ))}
          </div>

          <div className="mt-5 flex gap-3">
            {!running && !paused && (<button onClick={start} className="primary">Start</button>)}
            {running && (<button onClick={pause} className="secondary">Pause</button>)}
            {!running && paused && (<button onClick={resume} className="primary">Resume</button>)}
            <button onClick={reset} className="ghost">Reset</button>
            {alarming && (<button onClick={stopAlarm} className="ghost">Stop</button>)}
          </div>
        </div>
      </main>

      {/* Ad banner (placeholder) */}
      <footer className="w-full max-w-md mt-6">
        <button type="button" className="adbar w-full flex items-center gap-3 rounded-xl px-4 py-3 border" aria-label="Ad banner">
          <span className="adicon" aria-hidden>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M3 10h2l7-4v12l-7-4H3V10zm16 2a3 3 0 0 1-2.83 2.995L16 15h-1v-6h1a3 3 0 0 1 3 3z"/>
            </svg>
          </span>
          <div className="flex flex-col text-left">
            <span className="text-sm font-semibold leading-none">Advertising Space Available</span>
            <span className="text-xs opacity-80 leading-none mt-1">Reach verified humans</span>
          </div>
        </button>
      </footer>

      <style jsx>{`
        .btn { border-radius: 1rem; padding: 0.6rem 0.5rem; background: #18181b; border: 1px solid #27272a; font-weight: 600; }
        .btn:disabled { opacity: 0.4 }
        .chip { padding: 0.4rem 0.8rem; border-radius: 999px; background: #0a0a0a; border: 1px solid #27272a; font-weight: 600; font-size: 0.9rem; }
        .primary { background: white; color: black; border-radius: 999px; font-weight: 800; padding: 0.7rem 1.2rem; }
        .secondary { background: #e5e7eb; color: #000; border-radius: 999px; font-weight: 800; padding: 0.7rem 1.2rem; }
        .ghost { border-radius: 999px; padding: 0.6rem 1rem; border: 1px solid #27272a; }

        .adbar { background: #FEF3C7; color: #92400E; border-color: #FCD34D; box-shadow: 0 1px 0 rgba(0,0,0,0.02) inset; }
        .adicon { display: inline-flex; align-items: center; justify-content: center; background: #FDE68A; color: #92400E; border-radius: 999px; width: 28px; height: 28px; }
      `}</style>
    </div>
  );
}

