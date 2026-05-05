import React, { useState, useEffect } from 'react';
import { Lobby } from './components/Lobby';
import { Game } from './components/Game';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [gameState, setGameState] = useState<'lobby' | 'playing'>('lobby');
  const [roomData, setRoomData] = useState<{ roomId: string; name: string } | null>(null);

  const handleJoin = (roomId: string, name: string) => {
    setRoomData({ roomId, name });
    setGameState('playing');
  };

  return (
    <div className="w-full h-screen bg-[#0a0a0a] text-white overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        {gameState === 'lobby' ? (
          <motion.div
            key="lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <Lobby onJoin={handleJoin} />
          </motion.div>
        ) : (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            {roomData && <Game roomData={roomData} onExit={() => setGameState('lobby')} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
