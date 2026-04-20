import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type Tab = 'multiplayer' | 'contests' | 'dashboard';

const HowItWorks: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('multiplayer');

  return (
    <div className="bg-gray-900 min-h-screen w-full font-sans flex flex-col selection:bg-cyan-500/30">

      {/* Nav */}
      <nav className="w-full border-b border-gray-800 bg-gray-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-cyan-300 tracking-tighter font-mono" style={{ textShadow: '0 0 8px rgba(34,211,238,0.5)' }}>
            CodePvP
          </div>
          <button onClick={() => navigate('/')} className="text-sm text-gray-500 hover:text-cyan-400 transition-colors">
            ← Back to Arena
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center py-20 px-6 max-w-3xl mx-auto">
        <p className="text-purple-400 tracking-[0.2em] uppercase text-xs font-bold mb-4">How it works</p>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
          Code. Compete. <span className="text-cyan-400">Climb.</span>
        </h1>
        <p className="text-gray-400 text-lg">Two modes. One objective — write faster, cleaner code than the team across from you.</p>
      </section>

      {/* Tab switcher */}
      <div className="flex gap-2 justify-center px-6 pb-12 flex-wrap">
        {(['multiplayer', 'contests', 'dashboard'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-lg border text-xs font-bold uppercase tracking-widest font-mono transition-all ${
              activeTab === tab
                ? 'bg-cyan-400 text-gray-900 border-cyan-400'
                : 'bg-transparent text-gray-500 border-gray-800 hover:border-gray-700 hover:text-gray-300'
            }`}
          >
            {tab === 'multiplayer' ? 'Multiplayer' : tab === 'contests' ? 'FFA Contests' : 'Dashboard'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto w-full px-6 pb-20">

        {activeTab === 'multiplayer' && (
          <div className="space-y-0">
            <Phase num="01" title="Find your match">
              <p className="text-gray-400 text-sm leading-relaxed">Queue into ranked 1v1 matchmaking or set up a private lobby and send the link to a friend. Custom rooms let you pick team size, problem difficulty, and time limit before locking in.</p>
              <div className="flex gap-2 flex-wrap mt-3">
                <Tag color="cyan">Ranked matchmaking</Tag>
                <Tag color="purple">Private rooms</Tag>
                <Tag color="orange">Custom settings</Tag>
              </div>
            </Phase>

            <Phase num="02" title="Live sync — your team's code, shared in real time">
              <p className="text-gray-400 text-sm leading-relaxed">Both teams get the same problem set. Within your team, every teammate on the same question and language sees code changes as they happen — no refresh, no delay.</p>
              <SyncDemo />
              <NoteBox>
                Live sync is per question, per language. If a teammate switches to a different question or language, they get a clean editor. Sync can be toggled off at any time — some players prefer to solo.
              </NoteBox>
            </Phase>

            <Phase num="03" title="Submit — and wait for the verdict">
              <p className="text-gray-400 text-sm leading-relaxed">When you're ready, hit submit. Your code enters a queue, gets compiled and run against all test cases on isolated infrastructure. Pass every case and the question is marked solved for your team.</p>
              <SubmissionFlow />
            </Phase>

            <Phase num="04" title="Rating — earn it or lose it" last>
              <p className="text-gray-400 text-sm leading-relaxed">When the match ends, rating changes based on your team's performance — questions solved, time taken, and opponent strength all factor in.</p>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="rounded-lg p-4 bg-emerald-500/5 border border-emerald-500/20">
                  <div className="text-2xl font-black text-emerald-400 font-mono">+24</div>
                  <div className="text-xs text-gray-500 mt-1">Win — solved 3/3 faster</div>
                </div>
                <div className="rounded-lg p-4 bg-red-500/5 border border-red-500/20">
                  <div className="text-2xl font-black text-red-400 font-mono">−18</div>
                  <div className="text-xs text-gray-500 mt-1">Loss — 1 unsolved at time</div>
                </div>
              </div>
            </Phase>
          </div>
        )}

        {activeTab === 'contests' && (
          <div className="space-y-0">
            <Phase num="01" title="Register your team">
              <p className="text-gray-400 text-sm leading-relaxed">Contests are free-for-all — any team can register before the start time. No invite needed. Once the clock hits zero, every registered team unlocks the same problem set simultaneously.</p>
              <div className="flex gap-2 flex-wrap mt-3">
                <Tag color="orange">Open registration</Tag>
                <Tag color="cyan">Same start time globally</Tag>
                <Tag color="purple">Team entry</Tag>
              </div>
            </Phase>

            <Phase num="02" title="Solve fast, score high">
              <p className="text-gray-400 text-sm leading-relaxed">Every problem carries a point value. First to submit a correct solution scores full points — late solves may score less depending on contest rules. Speed and correctness both matter.</p>
              <p className="text-gray-400 text-sm leading-relaxed mt-3">Live sync still applies within your team. Coordinate on hard problems, divide and conquer the rest.</p>
            </Phase>

            <Phase num="03" title="Leaderboard — live throughout the contest" last>
              <p className="text-gray-400 text-sm leading-relaxed">Scores update in real time as teams submit. Tie on points? The team that reached the score first wins. There's no coasting — anyone can surge in the final minutes.</p>
            </Phase>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-0">
            <Phase num="01" title="Your rating, your rank">
              <p className="text-gray-400 text-sm leading-relaxed">Every match and contest adjusts your global rating. Track where you sit relative to the rest of the platform — and watch it move in real time after each result.</p>
            </Phase>

            <Phase num="02" title="Match history">
              <p className="text-gray-400 text-sm leading-relaxed">Every match is logged — who you played, what you solved, how long each submission took. Review where you lost time, spot patterns in your errors, and see how top players approached the same problems.</p>
              <div className="flex gap-2 flex-wrap mt-3">
                <Tag color="cyan">Per-question timing</Tag>
                <Tag color="purple">Submission history</Tag>
                <Tag color="green">Opponent stats</Tag>
              </div>
            </Phase>

            <Phase num="03" title="Loadout settings" last>
              <p className="text-gray-400 text-sm leading-relaxed">Set your preferred language, editor keybindings, and default sync preferences before you queue. Your loadout carries across every match — no reconfiguring mid-lobby.</p>
            </Phase>
          </div>
        )}
      </div>

      {/* CTA */}
      <section className="border-t border-gray-800 py-20 px-6 text-center">
        <h2 className="text-3xl font-extrabold text-white mb-3">Ready to run it?</h2>
        <p className="text-gray-500 text-sm mb-8">Queue into a match. See where you actually land.</p>
        <button
          onClick={() => navigate('/MultiPlayer')}
          className="px-10 py-4 font-bold text-gray-900 bg-cyan-400 rounded-lg text-sm tracking-wide font-mono
          transition-all duration-300 hover:bg-cyan-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(34,211,238,0.4)]"
        >
          Enter the Arena
        </button>
      </section>

      <footer className="border-t border-gray-800 py-6 text-center text-gray-700 text-xs">
        &copy; {new Date().getFullYear()} CodePvP. All rights reserved.
      </footer>
    </div>
  );
};

// --- Sub-components ---

const Phase: React.FC<{ num: string; title: string; children: React.ReactNode; last?: boolean }> = ({ num, title, children, last }) => (
  <div className={`grid grid-cols-[80px_1fr] gap-6 py-10 ${!last ? 'border-b border-gray-800' : ''}`}>
    <div className="text-3xl font-black text-gray-800 font-mono pt-1">{num}</div>
    <div>
      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  </div>
);

const Tag: React.FC<{ color: 'cyan' | 'purple' | 'orange' | 'green' | 'red'; children: React.ReactNode }> = ({ color, children }) => {
  const styles = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return (
    <span className={`inline-block text-xs font-bold px-2 py-1 rounded border uppercase tracking-wider ${styles[color]}`}>
      {children}
    </span>
  );
};

const NoteBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex gap-3 mt-4 bg-cyan-500/5 border border-cyan-500/15 rounded-lg p-4">
    <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-cyan-400" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1"/>
      <path d="M8 7v4M8 5.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
    <p className="text-xs text-gray-400 leading-relaxed">{children}</p>
  </div>
);

const SyncDemo: React.FC = () => {
  const [typedChars, setTypedChars] = useState(0);
  const [rahulChars, setRahulChars] = useState(0);
  const [arjunDone, setArjunDone] = useState(false);
  const fullLine = '        return [seen[diff], i]';

  // Arjun types
  useEffect(() => {
    setArjunDone(false);
    let chars = 0;
    const interval = setInterval(() => {
      if (chars < fullLine.length) {
        chars++;
        setTypedChars(chars);
      } else {
        setArjunDone(true);
        clearInterval(interval);
      }
    }, 80);
    return () => clearInterval(interval);
  }, []);  // runs once on mount

  // Reset loop — only fires after Arjun finishes AND Rahul catches up
  useEffect(() => {
    if (!arjunDone || rahulChars < fullLine.length) return;
    const timeout = setTimeout(() => {
      setTypedChars(0);
      setRahulChars(0);
      setArjunDone(false);
      // Re-trigger Arjun's typing by re-running his effect
      let chars = 0;
      const interval = setInterval(() => {
        if (chars < fullLine.length) {
          chars++;
          setTypedChars(chars);
        } else {
          setArjunDone(true);
          clearInterval(interval);
        }
      }, 80);
    }, 1200);
    return () => clearTimeout(timeout);
  }, [arjunDone, rahulChars]);

  // Rahul: lag 4 chars behind while Arjun types, catch up fully after he stops
  useEffect(() => {
    if (!arjunDone) {
      // Still typing — stay 4 chars behind
      setRahulChars(Math.max(0, typedChars - 4));
    } else {
      // Arjun done — animate Rahul catching up the remaining 4 chars
      if (rahulChars < fullLine.length) {
        const timeout = setTimeout(() => {
          setRahulChars(prev => Math.min(prev + 1, fullLine.length));
        }, 80);
        return () => clearTimeout(timeout);
      }
    }
  }, [typedChars, arjunDone, rahulChars]);

  const arjunLine = fullLine.slice(0, typedChars);
  const rahulLine = fullLine.slice(0, rahulChars);

  return (
    <div className="mt-4 border border-gray-800 rounded-xl overflow-hidden bg-black/30">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
        <span className="text-xs font-bold text-gray-500 tracking-wider">Q1 — Two Sum · Python</span>
        <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live sync on
        </span>
      </div>
      <div className="grid grid-cols-[1fr_44px_1fr]">
        <EditorPane initials="AJ" name="arjun" color="purple" extraLine={arjunLine} showCursor />
        <div className="flex flex-col items-center justify-center border-x border-gray-800 gap-1.5">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M2 8h12M10 5l3 3-3 3M6 5L3 8l3 3" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-gray-600 font-mono" style={{ fontSize: '8px' }}>sync</span>
        </div>
        <EditorPane initials="RK" name="rahul" color="cyan" extraLine={rahulLine} />
      </div>
    </div>
  );
};

const EditorPane: React.FC<{
  initials: string;
  name: string;
  color: 'cyan' | 'purple';
  showCursor?: boolean;
  extraLine?: string;
}> = ({ initials, name, color, showCursor, extraLine = '' }) => {
  const avatarStyle = color === 'cyan'
    ? 'bg-cyan-400/15 text-cyan-400'
    : 'bg-purple-400/15 text-purple-400';

  // Build code as a single string — no JSX whitespace issues
  const baseCode = [
    'def twoSum(nums, target):',
    '    seen = {}',
    '    for i, n in enumerate(nums):',
    '        diff = target - n',
    '        if diff in seen:',
  ].join('\n');

  return (
    <div>
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${avatarStyle}`}>
            {initials}
          </div>
          <span className="text-xs text-gray-400 font-mono">{name}</span>
        </div>
        <span className="text-xs text-gray-600 font-mono">py</span>
      </div>

      <div className="p-3 bg-gray-950" style={{ minHeight: 120 }}>
        <pre className="font-mono text-xs leading-relaxed whitespace-pre m-0">
          <CodeLine code={baseCode} />
          {'\n'}
          <span className="text-gray-300">{extraLine}</span>
          {showCursor && (
            <span className="inline-block w-[2px] h-[12px] bg-cyan-400 ml-px align-text-bottom animate-pulse" />
          )}
        </pre>
      </div>
    </div>
  );
};

// Lightweight keyword highlighter — avoids JSX whitespace entirely
const CodeLine: React.FC<{ code: string }> = ({ code }) => {
  const tokens = code.split(/(\bdef\b|\bfor\b|\bin\b|\bif\b|\breturn\b)/g);
  return (
    <>
      {tokens.map((tok, i) =>
        ['def', 'for', 'in', 'if', 'return'].includes(tok)
          ? <span key={i} className="text-purple-400">{tok}</span>
          : <span key={i} className="text-gray-300">{tok}</span>
      )}
    </>
  );
};

const SubmissionFlow: React.FC = () => {
  const steps = [
    { label: 'Submit', state: 'done' },
    { label: 'Queue', state: 'done' },
    { label: 'Running tests', state: 'active' },
    { label: 'Verdict', state: 'pending' },
    { label: 'Accepted', state: 'success' },
  ];
  const dotStyles: Record<string, string> = {
    done: 'border-emerald-500 text-emerald-400 bg-emerald-500/10',
    active: 'border-cyan-400 text-cyan-400 bg-cyan-400/10',
    pending: 'border-yellow-500 text-yellow-400 bg-yellow-500/10',
    success: 'border-emerald-400 text-emerald-400',
  };
  const labelStyles: Record<string, string> = {
    done: 'text-emerald-400',
    active: 'text-cyan-400',
    pending: 'text-yellow-400',
    success: 'text-emerald-400',
  };
  return (
    <div className="mt-4 border border-gray-800 rounded-xl p-4 bg-black/30">
      <div className="flex items-start">
        {steps.map((step, i) => (
          <React.Fragment key={step.label}>
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold font-mono ${dotStyles[step.state]}`}>
                {step.state === 'done' ? '✓' : step.state === 'active' ? '▶' : step.state === 'pending' ? '?' : 'AC'}
              </div>
              <span className={`text-xs mt-1 text-center leading-tight max-w-[56px] font-medium ${labelStyles[step.state]}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mt-3.5 mx-1 ${step.state === 'done' ? 'bg-emerald-500' : 'bg-gray-800'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default HowItWorks;