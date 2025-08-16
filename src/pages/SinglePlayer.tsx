"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserCircle, Bot, Timer } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import AnimatedBackground from './components/AnimatedBackground';
import GlitchTitle from './components/GlitchTitle';

const AI_OPPONENTS = [
  {
    name: "CodeBot",
    avatar: <Bot size={64} className="text-cyan-400 drop-shadow-neon" />,
    difficulties: ["Easy", "Medium", "Hard", "Boss"],
  },
  {
    name: "DebugDroid",
    avatar: <UserCircle size={64} className="text-pink-400 drop-shadow-neon" />,
    difficulties: ["Easy", "Medium", "Hard", "Boss"],
  },
  {
    name: "AlgoAI",
    avatar: <UserCircle size={64} className="text-green-400 drop-shadow-neon" />,
    difficulties: ["Easy", "Medium", "Hard", "Boss"],
  },
  {
    name: "ScriptSage",
    avatar: <UserCircle size={64} className="text-yellow-400 drop-shadow-neon" />,
    difficulties: ["Easy", "Medium", "Hard", "Boss"],
  },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "bg-gradient-to-r from-green-400 to-emerald-500",
  Medium: "bg-gradient-to-r from-blue-400 to-indigo-500",
  Hard: "bg-gradient-to-r from-pink-500 to-red-500",
  Boss: "bg-gradient-to-r from-yellow-400 to-orange-500",
};

const TIMER_OPTIONS = [
  { label: "5 min", value: 5 },
  { label: "10 min", value: 10 },
  { label: "Unlimited", value: 0 },
];

const ArenaLobby: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [ai, setAI] = useState(AI_OPPONENTS[0]);
  const [difficulty, setDifficulty] = useState("Easy");
  const [timer, setTimer] = useState(5);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login');
      }
    });
    setTimeout(() => {
      setAI(AI_OPPONENTS[Math.floor(Math.random() * AI_OPPONENTS.length)]);
      setLoading(false);
    }, 1200);
  }, [navigate]);

  const handleStart = () => {
    navigate('/battle', { state: { ai, difficulty, timer } });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center font-mono relative overflow-hidden">
      <AnimatedBackground />
      <AnimatePresence>
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="z-10 flex flex-col items-center justify-center absolute inset-0"
          >
            <GlitchTitle text="Arena Loading..." className="text-5xl md:text-7xl mb-8" />
            <motion.div
              className="w-16 h-16 rounded-full border-4 border-cyan-400 border-t-pink-500 animate-spin"
              style={{ boxShadow: "0 0 32px #0ff, 0 0 64px #f0f" }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="z-10 mx-auto bg-black/40 backdrop-blur-lg rounded-2xl border border-cyan-400/30 shadow-2xl shadow-cyan-500/20 p-8 md:p-12 flex flex-col items-center"
          >
            {/* AI Opponent Reveal */}
            <div className="flex flex-col items-center mb-10 w-full">
              <div className="mb-2">{ai.avatar}</div>
              <GlitchTitle text={ai.name} className="text-3xl md:text-4xl mb-1" />
              <div className="text-sm text-cyan-200 flex items-center gap-2 font-mono tracking-wide">
                <Bot size={16} className="inline-block" /> AI Opponent
              </div>
            </div>
            {/* Options */}
            <div className="w-full flex flex-col gap-8">
              {/* Difficulty */}
              <div>
                <div className="text-lg font-semibold mb-3 text-purple-200">Select Difficulty</div>
                <div className="flex gap-4 flex-wrap">
                  {ai.difficulties.map((level) => (
                    <button
                      key={level}
                      className={`px-7 py-2 rounded-xl font-bold text-white text-lg shadow-lg border-2 transition-all duration-200
                        ${DIFFICULTY_COLORS[level]}
                        ${difficulty === level
                          ? "border-cyan-400 scale-105 ring-2 ring-cyan-400"
                          : "border-transparent opacity-70 hover:opacity-100"}
                      `}
                      onClick={() => setDifficulty(level)}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              {/* Timer */}
              <div>
                <div className="text-lg font-semibold mb-3 text-purple-200">Select Timer</div>
                <div className="flex gap-4 flex-wrap">
                  {TIMER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      className={`px-7 py-2 rounded-xl font-bold text-white text-lg shadow-lg border-2 transition-all duration-200
                        bg-gradient-to-r from-gray-800 to-gray-900
                        ${timer === opt.value
                          ? "border-cyan-400 scale-105 ring-2 ring-cyan-400"
                          : "border-gray-700 opacity-70 hover:opacity-100"}
                      `}
                      onClick={() => setTimer(opt.value)}
                    >
                      <Timer size={18} className="inline-block mr-1" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Start Battle Button */}
            <motion.button
              whileHover={{ scale: 1.08, boxShadow: "0 0 32px #f0f, 0 0 64px #0ff" }}
              whileTap={{ scale: 0.97 }}
              className="mt-12 px-16 py-5 rounded-2xl text-2xl font-extrabold bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 text-white shadow-xl drop-shadow-neon border-4 border-white/10 hover:border-cyan-400 focus:outline-none tracking-wider transition-all"
              onClick={handleStart}
            >
              Start Battle
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ArenaLobby;
