import React from 'react';
import { useNavigate } from 'react-router-dom';

const AboutUs: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-900 min-h-screen w-full font-sans flex flex-col selection:bg-cyan-500/30">

      {/* Nav */}
      <nav className="w-full border-b border-gray-800 bg-gray-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-cyan-300 tracking-tighter font-mono" style={{ textShadow: `0 0 8px rgba(34,211,238,0.5)` }}>
            CodePvP
          </div>
          <button onClick={() => navigate('/')} className="text-sm text-gray-500 hover:text-cyan-400 transition-colors">
            ← Back to Arena
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="w-full py-24 px-6 flex flex-col items-center text-center">
        <div className="max-w-3xl">
          <p className="text-purple-400 tracking-[0.2em] uppercase text-xs font-bold mb-5">About CodePvP</p>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
            Built for developers who want to{' '}
            <span className="text-cyan-400">compete</span>, not just practice.
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-2xl mx-auto">
            Most coding tools teach you in isolation. We built CodePvP for the moment that actually matters — when someone else is solving the same problem, faster, right now.
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="w-full border-y border-gray-800 bg-black/30 grid grid-cols-3">
        {[
          { num: '100+', label: 'Competitors at launch' },
          { num: '1v1', label: 'Real-time duels' },
          { num: 'MVP', label: 'Battle-tested at hackathon' },
        ].map((s) => (
          <div key={s.num} className="py-8 text-center border-r border-gray-800 last:border-r-0">
            <div className="text-3xl font-extrabold text-cyan-400 font-mono">{s.num}</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Story */}
      <section className="w-full max-w-3xl mx-auto px-6 py-20 space-y-16">
        {[
          {
            label: 'The problem',
            title: 'Solo grinding doesn\'t prepare you for pressure.',
            body: [
              'LeetCode is a library. A great one. But solving problems on your own, with no timer, no opponent, no stakes — it\'s a fundamentally different skill than writing good code under pressure.',
              'Interviews, deadlines, on-call incidents — they all require composure. We built the arena to train that muscle.',
            ],
          },
          {
            label: 'The origin',
            title: 'Started at a hackathon, validated fast.',
            body: [
              'CodePvP launched its first contest at a college hackathon with over 100 participants competing in real-time algorithmic duels. No fancy onboarding, no hand-holding — just raw competition.',
              'The energy in the room told us everything we needed to know about what we were building.',
            ],
          },
          {
            label: 'The vision',
            title: 'Think Valorant, but your weapon is your code.',
            body: [
              'We\'re building the competitive layer that developer tooling has always been missing. Ranked matchmaking, team lobbies, private duels, skill-based progression — all the things that make games compelling, applied to software engineering.',
            ],
          },
        ].map((block) => (
          <div key={block.label} className="grid grid-cols-3 gap-8 pb-16 border-b border-gray-800 last:border-b-0">
            <div className="text-purple-400 text-xs uppercase tracking-widest font-semibold pt-1">{block.label}</div>
            <div className="col-span-2">
              <h3 className="text-xl font-bold text-white mb-3">{block.title}</h3>
              {block.body.map((p, i) => (
                <p key={i} className="text-gray-400 leading-relaxed text-sm mb-3 last:mb-0">{p}</p>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Values */}
      <section className="w-full bg-black/30 border-y border-gray-800 py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-purple-400 tracking-[0.2em] uppercase text-xs font-bold mb-8">What we stand for</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { n: '01', title: 'Pressure is a feature', body: 'Real improvement happens at the edge of your comfort zone. We design every system to put you there.' },
              { n: '02', title: 'Skill over status', body: 'Your rank reflects what you can do right now — not your resume, your employer, or your network.' },
              { n: '03', title: 'Competition is social', body: 'Compete with friends, challenge colleagues, find your rivals. The best growth comes from people you respect.' },
            ].map((v) => (
              <div key={v.n} className="border border-gray-800 rounded-xl p-6 hover:border-cyan-500/30 transition-colors">
                <div className="text-2xl font-black text-gray-800 font-mono mb-4">{v.n}</div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wide mb-2">{v.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full py-24 px-6 flex flex-col items-center text-center">
        <h2 className="text-3xl font-extrabold text-white mb-3">The arena is open.</h2>
        <p className="text-gray-500 mb-8 text-sm">Stop practicing alone. Find out where you actually rank.</p>
        <button
          onClick={() => navigate('/')}
          className="px-10 py-4 font-bold text-gray-900 bg-cyan-400 rounded-lg text-sm tracking-wide font-mono
          transition-all duration-300 hover:bg-cyan-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(34,211,238,0.4)]"
        >
          Enter the Arena
        </button>
      </section>

      <footer className="w-full py-6 text-center text-gray-700 text-xs mt-auto border-t border-gray-800">
        &copy; {new Date().getFullYear()} CodePvP. All rights reserved.
      </footer>
    </div>
  );
};

export default AboutUs;