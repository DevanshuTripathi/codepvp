// "use client";

// import React, { useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { UserCircle, Bot, Timer } from "lucide-react";
// import { useNavigate } from 'react-router-dom';
// import { auth } from '../../firebaseConfig';
// import { onAuthStateChanged } from 'firebase/auth';
// import AnimatedBackground from './components/AnimatedBackground';
// import GlitchTitle from './components/GlitchTitle';

// const AI_OPPONENTS = [
//   {
//     name: "CodeBot",
//     avatar: <Bot size={64} className="text-cyan-400 drop-shadow-neon" />,
//     difficulties: ["Easy", "Medium", "Hard", "Boss"],
//   },
//   {
//     name: "DebugDroid",
//     avatar: <UserCircle size={64} className="text-pink-400 drop-shadow-neon" />,
//     difficulties: ["Easy", "Medium", "Hard", "Boss"],
//   },
//   {
//     name: "AlgoAI",
//     avatar: <UserCircle size={64} className="text-green-400 drop-shadow-neon" />,
//     difficulties: ["Easy", "Medium", "Hard", "Boss"],
//   },
//   {
//     name: "ScriptSage",
//     avatar: <UserCircle size={64} className="text-yellow-400 drop-shadow-neon" />,
//     difficulties: ["Easy", "Medium", "Hard", "Boss"],
//   },
// ];

// const DIFFICULTY_COLORS: Record<string, string> = {
//   Easy: "bg-gradient-to-r from-green-400 to-emerald-500",
//   Medium: "bg-gradient-to-r from-blue-400 to-indigo-500",
//   Hard: "bg-gradient-to-r from-pink-500 to-red-500",
//   Boss: "bg-gradient-to-r from-yellow-400 to-orange-500",
// };

// const TIMER_OPTIONS = [
//   { label: "5 min", value: 5 },
//   { label: "10 min", value: 10 },
//   { label: "Unlimited", value: 0 },
// ];

// const ArenaLobby: React.FC = () => {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [ai, setAI] = useState(AI_OPPONENTS[0]);
//   const [difficulty, setDifficulty] = useState("Easy");
//   const [timer, setTimer] = useState(5);

//   useEffect(() => {
//     onAuthStateChanged(auth, (user) => {
//       if (!user) {
//         navigate('/login');
//       }
//     });
//     setTimeout(() => {
//       setAI(AI_OPPONENTS[Math.floor(Math.random() * AI_OPPONENTS.length)]);
//       setLoading(false);
//     }, 1200);
//   }, [navigate]);

//   const handleStart = () => {
//     navigate('/battle', { state: { ai, difficulty, timer } });
//   };

//   return (
//     <div className="min-h-screen w-full flex items-center justify-center font-mono relative overflow-hidden">
//       <AnimatedBackground />
//       <AnimatePresence>
//         {loading ? (
//           <motion.div
//             key="loading"
//             initial={{ opacity: 0, scale: 0.8 }}
//             animate={{ opacity: 1, scale: 1 }}
//             exit={{ opacity: 0, scale: 0.8 }}
//             className="z-10 flex flex-col items-center justify-center absolute inset-0"
//           >
//             <div className="text-5xl md:text-7xl mb-8">
//               <GlitchTitle text="Arena Loading..." />
//             </div>
//             <motion.div
//               className="w-16 h-16 rounded-full border-4 border-cyan-400 border-t-pink-500 animate-spin"
//               style={{ boxShadow: "0 0 32px #0ff, 0 0 64px #f0f" }}
//             />
//           </motion.div>
//         ) : (
//           <motion.div
//             key="setup"
//             initial={{ opacity: 0, y: 40 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.7 }}
//             className="z-10 mx-auto bg-black/40 backdrop-blur-lg rounded-2xl border border-cyan-400/30 shadow-2xl shadow-cyan-500/20 p-8 md:p-12 flex flex-col items-center"
//           >
//             {/* AI Opponent Reveal */}
//             <div className="flex flex-col items-center mb-10 w-full">
//               <div className="mb-2">{ai.avatar}</div>
//               <div className="text-3xl md:text-4xl mb-1 font-extrabold text-white">{ai.name}</div>
//               <div className="text-sm text-cyan-200 flex items-center gap-2 font-mono tracking-wide">
//                 <Bot size={16} className="inline-block" /> AI Opponent
//               </div>
//             </div>
//             {/* Options */}
//             <div className="w-full flex flex-col gap-8">
//               {/* Difficulty */}
//               <div>
//                 <div className="text-lg font-semibold mb-3 text-purple-200">Select Difficulty</div>
//                 <div className="flex gap-4 flex-wrap">
//                   {ai.difficulties.map((level) => (
//                     <button
//                       key={level}
//                       className={`px-7 py-2 rounded-xl font-bold text-white text-lg shadow-lg border-2 transition-all duration-200
//                         ${DIFFICULTY_COLORS[level]}
//                         ${difficulty === level
//                           ? "border-cyan-400 scale-105 ring-2 ring-cyan-400"
//                           : "border-transparent opacity-70 hover:opacity-100"}
//                       `}
//                       onClick={() => setDifficulty(level)}
//                     >
//                       {level}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//               {/* Timer */}
//               <div>
//                 <div className="text-lg font-semibold mb-3 text-purple-200">Select Timer</div>
//                 <div className="flex gap-4 flex-wrap">
//                   {TIMER_OPTIONS.map((opt) => (
//                     <button
//                       key={opt.value}
//                       className={`px-7 py-2 rounded-xl font-bold text-white text-lg shadow-lg border-2 transition-all duration-200
//                         bg-gradient-to-r from-gray-800 to-gray-900
//                         ${timer === opt.value
//                           ? "border-cyan-400 scale-105 ring-2 ring-cyan-400"
//                           : "border-gray-700 opacity-70 hover:opacity-100"}
//                       `}
//                       onClick={() => setTimer(opt.value)}
//                     >
//                       <Timer size={18} className="inline-block mr-1" />
//                       {opt.label}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             </div>
//             {/* Start Battle Button */}
//             <motion.button
//               whileHover={{ scale: 1.08, boxShadow: "0 0 32px #f0f, 0 0 64px #0ff" }}
//               whileTap={{ scale: 0.97 }}
//               className="mt-12 px-16 py-5 rounded-2xl text-2xl font-extrabold bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 text-white shadow-xl drop-shadow-neon border-4 border-white/10 hover:border-cyan-400 focus:outline-none tracking-wider transition-all"
//               onClick={handleStart}
//             >
//               Start Battle
//             </motion.button>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };

// export default ArenaLobby;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebaseConfig';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

const SinglePlayer: React.FC = () => {

    const navigate = useNavigate();

    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            if(!user) {
                navigate('/login');
            }
        })
    })

    const handleClick = () => {
        navigate('/');
    }

    // Data for the different coding challenge topics
    const topics = [
        { title: "Arrays & Hashing", description: "Master the fundamentals of data manipulation and lookup.", level: "Beginner", challenges: 8, completed: 5 },
        { title: "Two Pointers", description: "Efficiently solve problems by traversing data from both ends.", level: "Novice", challenges: 6, completed: 2 },
        { title: "Sliding Window", description: "Optimize solutions for subarray and substring problems.", level: "Novice", challenges: 7, completed: 1 },
        { title: "Stack", description: "Understand the LIFO principle for complex logical problems.", level: "Beginner", challenges: 4, completed: 4 },
        { title: "Binary Search", description: "Quickly find elements in sorted data structures.", level: "Intermediate", challenges: 9, completed: 3 },
        { title: "Linked List", description: "Manage dynamic data structures with nodes and pointers.", level: "Intermediate", challenges: 10, completed: 0 },
        { title: "Trees & Tries", description: "Navigate hierarchical data structures for advanced lookups.", level: "Veteran", challenges: 12, completed: 1 },
        { title: "Dynamic Programming", description: "Break down complex problems into simpler sub-problems.", level: "Veteran", challenges: 15, completed: 0 },
    ];

    // Helper function to determine the color and style of the level tag
    const getLevelClass = (level: string) => {
        switch (level) {
            case 'Beginner': return 'bg-green-500/20 text-green-300 border-green-400';
            case 'Novice': return 'bg-cyan-500/20 text-cyan-300 border-cyan-400';
            case 'Intermediate': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400';
            case 'Veteran': return 'bg-red-500/20 text-red-300 border-red-400';
            default: return 'bg-gray-500/20 text-gray-300 border-gray-400';
        }
    };

    return (
        <div className="z-10 flex flex-col items-center p-8 max-w-dvw h-dvh w-full
          bg-gray-900 backdrop-blur-md 
          border border-cyan-400/20
          shadow-2xl shadow-cyan-500/10">
            {/* <AnimatedBackground /> */}
            
            {/* Header section with title and back button */}
            <div className="w-full flex justify-between items-center mb-8">
                <h2 className="text-5xl font-bold text-cyan-300" style={{ textShadow: `0 0 8px #0ff` }}>Challenge Topics</h2>
                <button onClick={handleClick} className="text-purple-300 hover:text-white transition-colors duration-300 text-lg flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    Back to Menu
                </button>
            </div>

            {/* Grid layout for the topic cards */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {topics.map((topic, index) => (
                    <div key={index} className="flex flex-col justify-between p-5 rounded-lg bg-gray-900/50 border border-gray-700/50 hover:border-cyan-400/70 hover:-translate-y-1 transition-all duration-300">
                        <div>
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-2xl text-white font-bold">{topic.title}</h3>
                                <span className={`text-xs font-semibold px-3 py-1 border rounded-full ${getLevelClass(topic.level)}`}>
                                    {topic.level}
                                </span>
                            </div>
                            <p className="text-gray-400 mb-4 text-sm">{topic.description}</p>
                        </div>
                        <div className="mt-auto">
                            {/* Progress bar */}
                            <div className="w-full bg-gray-700/50 rounded-full h-2.5 mb-2">
                                <div className="bg-cyan-400 h-2.5 rounded-full" style={{ width: `${(topic.completed / topic.challenges) * 100}%` }}></div>
                            </div>
                            <p className="text-xs text-gray-300 mb-4">{topic.completed} / {topic.challenges} Challenges Completed</p>
                            <button className="w-full font-bold text-cyan-300 border-2 border-cyan-400/50 rounded-lg py-2 transition-all duration-300 hover:bg-cyan-300 hover:text-gray-900 hover:shadow-[0_0_15px_rgba(56,189,248,0.7)]">
                                Begin Challenges
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SinglePlayer;
