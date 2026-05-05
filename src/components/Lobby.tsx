import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Terminal, Users, Play, Settings, Map as MapIcon, Globe } from 'lucide-react';

interface LobbyProps {
  onJoin: (roomId: string, name: string) => void;
}

export function Lobby({ onJoin }: LobbyProps) {
  const [roomId, setRoomId] = useState('7777');
  const [name, setName] = useState('Player' + Math.floor(Math.random() * 1000));
  const [serverIp, setServerIp] = useState('26.145.10.221');

  return (
    <div className="w-full h-full bg-[#0f0f12] text-slate-200 font-sans p-10 flex flex-col overflow-hidden select-none">
      <header className="flex justify-between items-end mb-12 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-6xl font-black tracking-tighter text-red-600 uppercase leading-none">
            Voxel<br/>Vengeance
          </h1>
          <p className="text-xs tracking-[0.4em] uppercase text-slate-500 mt-2 font-mono">Multiplayer Arena Engine v0.8.4</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-mono text-emerald-500 flex items-center justify-end gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            NETWORK ACTIVE
          </div>
          <div className="text-xs text-slate-500 font-mono">RADMIN VIRTUAL LAN DETECTED</div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8 flex-grow">
        {/* Connection Section */}
        <section className="col-span-7 flex flex-col gap-6">
          <div className="bg-white/5 border-l-4 border-red-600 p-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Connect to Server</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[10px] uppercase mb-1 text-slate-500 font-bold tracking-wider">Your Handle</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 px-4 py-3 font-mono text-lg text-white outline-none ring-1 ring-white/5 focus:ring-red-600 transition-all"
                  placeholder="Enter Name..."
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-grow">
                  <label className="block text-[10px] uppercase mb-1 text-slate-500 font-bold tracking-wider">Server Identifier</label>
                  <input
                    type="text"
                    value={serverIp}
                    onChange={(e) => setServerIp(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 px-4 py-3 font-mono text-lg text-white outline-none ring-1 ring-white/5 focus:ring-red-600 transition-all font-mono"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-[10px] uppercase mb-1 text-slate-500 font-bold tracking-wider">Port</label>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 px-4 py-3 font-mono text-lg text-white outline-none ring-1 ring-white/5 focus:ring-red-600 transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => onJoin(roomId, name)}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-4 font-black uppercase tracking-widest transition-colors shadow-lg shadow-red-900/20 flex items-center justify-center gap-3"
            >
              <Play size={20} fill="currentColor" />
              Initiate Connection
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-grow">
            <div className="border border-white/10 p-6 flex flex-col justify-between hover:bg-white/5 cursor-pointer group transition-all">
              <div>
                <div className="text-2xl font-bold uppercase mb-1 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-white group-hover:bg-red-600 transition-colors"></div>
                  Host Server
                </div>
                <p className="text-xs text-slate-500 leading-relaxed italic">Launch a private session for friends using your local IP.</p>
              </div>
              <div className="h-1 w-12 bg-white/20 group-hover:w-full group-hover:bg-red-600 transition-all duration-500"></div>
            </div>
            <div className="border border-white/10 p-6 flex flex-col justify-between hover:bg-white/5 cursor-pointer group transition-all">
              <div>
                <div className="text-2xl font-bold uppercase mb-1 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-white group-hover:bg-blue-600 transition-colors"></div>
                   Quick Match
                </div>
                <p className="text-xs text-slate-500 leading-relaxed italic">Automatically find an available public lobby.</p>
              </div>
              <div className="h-1 w-12 bg-white/20 group-hover:w-full group-hover:bg-blue-600 transition-all duration-500"></div>
            </div>
          </div>
        </section>

        {/* Editor & Logs Section */}
        <section className="col-span-5 flex flex-col gap-6">
          <div className="bg-red-600/5 border border-red-600/20 p-8 flex-grow flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase italic flex items-center gap-2">
                <MapIcon size={20} />
                Map Editor
              </h2>
              <span className="px-2 py-1 bg-red-600 text-[10px] font-bold tracking-tighter">BETA</span>
            </div>
            <div className="aspect-video bg-black flex items-center justify-center border border-white/5 mb-6 group cursor-crosshair relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <div className="text-center z-10">
                 <div className="text-slate-400 font-mono text-[10px] mb-2 tracking-[0.2em]">[ ARENA_VOID_01 ]</div>
                 <div className="w-32 h-px bg-white/20 mx-auto"></div>
              </div>
            </div>
            <div className="space-y-3">
              <button className="w-full border border-white/20 py-3 text-xs font-bold uppercase tracking-widest hover:bg-white text-white hover:text-black transition-all flex items-center justify-center gap-2">
                Launch Creator Suite
              </button>
              <button className="w-full border border-white/20 py-3 text-xs font-bold uppercase tracking-widest hover:bg-white text-white hover:text-black transition-all">
                Browse Workshop
              </button>
            </div>
          </div>

          <div className="border border-white/10 p-6 flex justify-between items-center bg-black/40">
             <div>
               <div className="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-1">Latest Log</div>
               <div className="text-xs font-mono text-white/70 italic">Peer handshake: {serverIp}... OK</div>
             </div>
             <div className="flex gap-4">
                <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-mono">PLR: 1,248</div>
                    <div className="text-[10px] text-slate-500 font-mono italic">V0.4.2-α</div>
                </div>
                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-white/5">
                    <Settings size={16} className="text-slate-400" />
                </div>
             </div>
          </div>
        </section>
      </div>

      <footer className="mt-10 flex justify-between items-center border-t border-white/5 pt-6">
        <div className="flex gap-8 text-[10px] uppercase tracking-widest font-bold text-slate-500">
          <a href="#" className="hover:text-red-500 transition-colors">Settings</a>
          <a href="#" className="hover:text-red-500 transition-colors">Profiles</a>
          <a href="#" className="hover:text-red-500 transition-colors">Documentation</a>
          <a href="#" className="hover:text-red-500 transition-colors">Credits</a>
        </div>
        <div className="text-[10px] text-slate-600 font-mono italic tracking-tighter">
          SYSTEM_ID: XA-449-RED-TOWN-VENGEANCE
        </div>
      </footer>
    </div>
  );
}
