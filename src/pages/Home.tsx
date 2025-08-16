import AnimatedBackground from './components/AnimatedBackground';
import GlitchTitle from './components/GlitchTitle';
import NavButton from './components/NavButton';
import { Link } from 'react-router-dom';


// --- Main App Component ---
export default function Home() {
  return (
    <div className="min-h-screen text-white flex items-center justify-center overflow-hidden font-mono">
      <AnimatedBackground />
      
      <div className="z-10 flex flex-col items-center text-center p-8 max-w-4xl
        bg-black/30 backdrop-blur-md 
        border border-cyan-400/20 rounded-xl
        shadow-2xl shadow-cyan-500/10">

        <GlitchTitle text="CodePvP" />
        
        <p className="text-lg md:text-xl text-purple-300 mb-12 max-w-2xl">
          The ultimate competitive coding arena. Challenge your mind, crush the competition.
        </p>

        <nav className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <Link to="/SinglePlayer">
          <NavButton icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M14.5 17.5 17 20l3-3-2.5-2.5"/>
  <path d="m14 11 6 6"/>
  <path d="m8 11-6 6"/>
  <path d="M11.5 17.5 9 20l-3-3 2.5-2.5"/>
  <path d="M2 2l20 20"/>
</svg>
}>
            Solo Showdown
          </NavButton>
          </Link>
          <NavButton icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7.5" r="4.5"></circle><path d="M22 11v-2a4 4 0 0 0-4-4H7"></path></svg>}>
            Multiplayer
          </NavButton>
          <NavButton icon={<svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 9h3m-3 3h3m-3 3h3m-6 1c-.306-.613-.933-1-1.618-1H7.618c-.685 0-1.312.387-1.618 1M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm7 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"/>
</svg>
}>
            Dashboard
          </NavButton>
          <NavButton href="https://github.com/DevanshuTripathi/codepvp" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>}>
            Github
          </NavButton>
        </nav>
      </div>
    </div>
  );
}
