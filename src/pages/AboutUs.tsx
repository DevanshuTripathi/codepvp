import React from 'react';

const AboutUs: React.FC = () => {
  // Use your production URL here, or an env variable
  const mainAppUrl = import.meta.env.DEV ? "http://localhost:5173" : "https://codepvp.tech";

  return (
    <div className="bg-gray-900 min-h-screen w-full font-sans flex flex-col selection:bg-cyan-500/30">
      
      {/* Top Navigation Bar */}
      <nav className="w-full border-b border-gray-800 bg-gray-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-cyan-300 tracking-tighter" style={{ textShadow: `0 0 8px rgba(34,211,238,0.5)` }}>
            CodePvP
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="w-full py-24 px-6 flex flex-col items-center text-center relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-4xl z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <p className="text-purple-400 tracking-[0.2em] uppercase text-sm font-bold mb-4">Elevating the Developer Sandbox</p>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8">
            Software Engineering is a <span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">Competitive Sport.</span>
          </h1>
          <p className="text-xl leading-relaxed text-gray-400 max-w-3xl mx-auto">
            CodePvP provides a high-performance, real-time arena where developers can test their algorithmic knowledge, refine their problem-solving speed, and collaborate under absolute pressure.
          </p>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="w-full bg-black/40 py-24 px-6 border-y border-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="flex flex-col p-8 border border-gray-800 rounded-2xl bg-gray-900/50 hover:bg-gray-800/50 hover:border-cyan-500/30 transition-all duration-300 group">
              <div className="text-purple-400 mb-6 bg-purple-400/10 w-16 h-16 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              </div>
              <h3 className="text-2xl text-gray-100 font-bold mb-3">Real-Time Combat</h3>
              <p className="text-base text-gray-400 leading-relaxed">
                Engage in low-latency matchmaking for 1v1 or team-based algorithmic battles. Code, compile, and conquer simultaneously against live opponents.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col p-8 border border-gray-800 rounded-2xl bg-gray-900/50 hover:bg-gray-800/50 hover:border-cyan-500/30 transition-all duration-300 group">
              <div className="text-cyan-400 mb-6 bg-cyan-400/10 w-16 h-16 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
              </div>
              <h3 className="text-2xl text-gray-100 font-bold mb-3">Global Scale</h3>
              <p className="text-base text-gray-400 leading-relaxed">
                Whether you're hosting private custom lobbies with colleagues or climbing the public leaderboards, our infrastructure is built to scale with the competition.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col p-8 border border-gray-800 rounded-2xl bg-gray-900/50 hover:bg-gray-800/50 hover:border-cyan-500/30 transition-all duration-300 group">
              <div className="text-purple-400 mb-6 bg-purple-400/10 w-16 h-16 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <h3 className="text-2xl text-gray-100 font-bold mb-3">Curated Challenges</h3>
              <p className="text-base text-gray-400 leading-relaxed">
                Dynamically scaling difficulties ensure that whether you are a junior developer or a seasoned engineer, you will be pushed to your absolute limits.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-24 px-6 flex flex-col items-center text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Join the Ranks?</h2>
        <p className="text-gray-400 mb-10 max-w-2xl text-lg">
          Stop coding in a vacuum. Prove your skills, climb the ladder, and see where you stand globally.
        </p>
        <a 
          href={mainAppUrl}
          className="px-10 py-4 font-bold text-gray-900 bg-cyan-400 rounded-lg text-lg tracking-wide
          transition-all duration-300 hover:bg-cyan-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(34,211,238,0.4)]"
        >
          Enter the Arena
        </a>
      </section>
      
      {/* Simple Footer */}
      <footer className="w-full py-8 text-center text-gray-600 text-sm mt-auto border-t border-gray-800">
        &copy; {new Date().getFullYear()} CodePvP. All rights reserved.
      </footer>

    </div>
  );
};

export default AboutUs;