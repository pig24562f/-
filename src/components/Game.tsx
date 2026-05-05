import React, { useEffect, useRef, useState } from 'react';
import { Engine } from '../game/Engine';
import { Crosshair, Shield, Heart, Map as MapIcon, LogOut, Info } from 'lucide-react';

interface GameProps {
  roomData: { roomId: string; name: string };
  onExit: () => void;
}

export function Game({ roomData, onExit }: GameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [hudData, setHudData] = useState({
    health: 100,
    playersCount: 1,
    fps: 60
  });

  useEffect(() => {
    if (containerRef.current) {
      engineRef.current = new Engine(containerRef.current, (state) => {
        // Handle engine state updates if needed
      });
      engineRef.current.connect(roomData.roomId, roomData.name);
    }

    return () => {
      engineRef.current?.dispose();
    };
  }, [roomData]);

  const handlePointerLock = () => {
    engineRef.current?.lockPointer();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
        engineRef.current?.placeVoxel();
    } else if (e.button === 2) { // Right click
        engineRef.current?.removeVoxel();
    }
  };

  useEffect(() => {
    const handleContext = (e: MouseEvent) => e.preventDefault();
    window.addEventListener('contextmenu', handleContext);
    return () => window.removeEventListener('contextmenu', handleContext);
  }, []);

  return (
    <div className="relative w-full h-full cursor-none overflow-hidden" onMouseDown={handleMouseDown}>
      <div ref={containerRef} className="w-full h-full bg-zinc-900" />
      
      {/* Click to start overlay */}
      <div 
        className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-opacity z-10 hover:bg-black/20"
        onClick={handlePointerLock}
      >
        <div className="text-center pointer-events-none">
          <p className="text-2xl font-black uppercase italic tracking-widest text-white animate-pulse">
            Click to Play
          </p>
          <div className="mt-4 flex gap-4 text-xs text-zinc-400 font-mono uppercase bg-black/50 p-4 rounded-xl">
             <span>[WASD] Move</span>
             <span>[SPACE] Jump</span>
             <span>[LMB] Place Block</span>
             <span>[RMB] Remove Block</span>
          </div>
        </div>
      </div>

      {/* HUD */}
      <div className="absolute inset-x-0 bottom-0 p-10 flex justify-between items-end pointer-events-none z-20">
        <div className="flex gap-6 items-end">
          <div className="bg-white/5 backdrop-blur-md border-l-4 border-red-600 p-8 min-w-64">
            <div className="flex items-center gap-2 mb-4 text-slate-400">
              <Heart size={14} fill="currentColor" className="text-red-600" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Vital Signs</span>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-6xl font-black italic tracking-tighter leading-none">{hudData.health}</div>
              <div className="text-xs text-red-600 font-bold uppercase tracking-widest leading-none mb-1">HP</div>
            </div>
            <div className="w-full h-1 bg-white/10 mt-6 relative overflow-hidden">
              <div 
                className="h-full bg-red-600 transition-all duration-300" 
                style={{ width: `${hudData.health}%` }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)] animate-shimmer" />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2 text-slate-500">
              <Shield size={14} className="text-blue-500" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Protection</span>
            </div>
            <div className="text-2xl font-black italic text-slate-300 tracking-tighter">OFFLINE</div>
            <div className="h-1 w-8 bg-blue-500/20 mt-4"></div>
          </div>
        </div>

        <div className="flex flex-col gap-4 items-end">
             <div className="bg-black/40 backdrop-blur-md border border-white/10 p-6 flex items-center gap-8">
                <div>
                    <div className="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-1">Session Data</div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <MapIcon size={12} className="text-red-600" />
                            <span className="text-xs font-mono text-white/70 uppercase">ID:{roomData.roomId}</span>
                        </div>
                        <div className="w-px h-3 bg-white/10" />
                        <div className="flex items-center gap-2">
                            <Info size={12} className="text-emerald-500" />
                            <span className="text-xs font-mono text-white/70 uppercase">PING: 24MS</span>
                        </div>
                    </div>
                </div>
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                </div>
             </div>
             
             <button 
                onClick={(e) => { e.stopPropagation(); onExit(); }}
                className="pointer-events-auto border border-white/10 p-4 hover:bg-red-600 transition-all flex items-center gap-3 group group-hover:border-red-600"
             >
                <span className="text-[10px] font-bold uppercase tracking-widest hidden group-hover:block transition-all">Terminate Connection</span>
                <LogOut size={20} className="text-slate-400 group-hover:text-white" />
             </button>
        </div>
      </div>

      {/* Crosshair */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
        <div className="relative">
            <div className="absolute w-4 h-4 -left-2 -top-2 flex items-center justify-center">
                 <div className="w-1 h-1 bg-white rounded-full" />
            </div>
            <div className="w-8 h-8 border-2 border-white/20 rounded-full" />
            <div className="absolute w-[2px] h-3 bg-white top-[-10px] left-[-1px]" />
            <div className="absolute w-[2px] h-3 bg-white bottom-[-10px] left-[-1px]" />
            <div className="absolute h-[2px] w-3 bg-white left-[-10px] top-[-1px]" />
            <div className="absolute h-[2px] w-3 bg-white right-[-10px] top-[-1px]" />
        </div>
      </div>
    </div>
  );
}
