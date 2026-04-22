import React, { useState, useEffect, useRef } from 'react';

// ─── Google Fonts ─────────────────────────────────────────────────────────────
const FontLoader: React.FC = () => {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);
  return null;
};

// ─── Scroll fade-in ───────────────────────────────────────────────────────────
const FadeIn: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children, delay = 0, className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

// ─── Animated counter ─────────────────────────────────────────────────────────
const Counter: React.FC<{ to: number; suffix?: string }> = ({ to, suffix = '' }) => {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const start = performance.now();
      const dur = 1600;
      const tick = (now: number) => {
        const t = Math.min((now - start) / dur, 1);
        setVal(Math.floor((1 - Math.pow(1 - t, 3)) * to));
        if (t < 1) requestAnimationFrame(tick); else setVal(to);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{val}{suffix}</span>;
};

// shared style tokens
const mono = "'DM Mono', monospace";
const sans = "'DM Sans', sans-serif";
const cyan = '#0891b2';
const cyanDark = '#0e7490';
const ink = '#0f172a';
const muted = '#64748b';
const border = '#e2e8f0';

// ─── Nav ─────────────────────────────────────────────────────────────────────
const Nav: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <nav style={{
      fontFamily: sans, position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(255,255,255,0.96)', borderBottom: `1px solid ${border}`,
      backdropFilter: 'blur(12px)',
      boxShadow: scrolled ? '0 1px 16px rgba(0,0,0,0.06)' : 'none',
      transition: 'box-shadow 0.2s',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: mono, fontSize: 16, fontWeight: 500, color: cyan, letterSpacing: '-0.03em' }}>CodePvP</span>
          <span style={{ width: 1, height: 14, background: '#d1d5db' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.12em', textTransform: 'uppercase' }}>for hiring</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {['How it works', 'Why us', 'Pricing'].map((l) => (
            <a key={l} href={`#${l.toLowerCase().replace(/\s/g, '-')}`}
              style={{ fontSize: 14, fontWeight: 500, color: '#374151', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = cyan)}
              onMouseLeave={e => (e.currentTarget.style.color = '#374151')}>
              {l}
            </a>
          ))}
          <a href="#contact" style={{
            fontFamily: mono, fontSize: 13, fontWeight: 500, color: '#fff',
            background: cyan, padding: '8px 18px', borderRadius: 8, textDecoration: 'none',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = cyanDark; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = cyan; e.currentTarget.style.transform = 'none'; }}>
            Book a demo
          </a>
        </div>
      </div>
    </nav>
  );
};

// ─── Hero ─────────────────────────────────────────────────────────────────────
const Hero: React.FC = () => (
  <section style={{ fontFamily: sans, background: '#fff', padding: '88px 24px 72px', textAlign: 'center' }}>
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        border: '1px solid #bae6fd', background: '#f0f9ff',
        borderRadius: 999, padding: '5px 14px', marginBottom: 28,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cyan, flexShrink: 0 }} />
        <span style={{ fontFamily: mono, fontSize: 11, color: cyan, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
          Beta Feature · hiring.codepvp.tech
        </span>
      </div>

      <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.75rem)', fontWeight: 700, color: ink, lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 22px' }}>
        Hire engineers who<br />
        <span style={{ color: cyan }}>collaborate & perform.</span>
      </h1>
      <p style={{ fontSize: 17, color: muted, lineHeight: 1.78, maxWidth: 520, margin: '0 auto 36px', fontWeight: 400 }}>
        Skip the standard online tests. Put 2 candidates in a live pair-coding environment to solve complex DSA questions together. See exactly how they communicate, adapt, and execute.
      </p>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <a href="#contact" style={{
          fontFamily: mono, fontSize: 14, fontWeight: 500, color: '#fff', background: cyan,
          padding: '12px 26px', borderRadius: 9, textDecoration: 'none',
          boxShadow: '0 4px 14px rgba(8,145,178,0.28)', transition: 'all 0.18s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = cyanDark; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = cyan; e.currentTarget.style.transform = 'none'; }}>
          Book a free demo
        </a>
        <a href="#how-it-works" style={{
          fontFamily: mono, fontSize: 14, fontWeight: 500, color: '#374151',
          padding: '12px 26px', borderRadius: 9, textDecoration: 'none',
          border: `1px solid ${border}`, transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#9ca3af'; e.currentTarget.style.color = ink; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = '#374151'; }}>
          See how it works →
        </a>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0,
        marginTop: 60, paddingTop: 44, borderTop: `1px solid #f1f5f9`,
        maxWidth: 480, marginLeft: 'auto', marginRight: 'auto',
      }}>
        {[{ n: 500, s: '+', l: 'Pair sessions run' }, { n: 40, s: '%', l: 'Faster shortlisting' }, { n: 3, s: 'x', l: 'Collaboration signal' }].map(({ n, s, l }, i) => (
          <div key={l} style={{ textAlign: 'center', borderRight: i < 2 ? `1px solid #f1f5f9` : 'none', padding: '0 20px' }}>
            <div style={{ fontFamily: mono, fontSize: 30, fontWeight: 500, color: cyan, lineHeight: 1 }}>
              <Counter to={n} suffix={s} />
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── Logo strip ───────────────────────────────────────────────────────────────
const LogoStrip: React.FC = () => (
  <div style={{ fontFamily: sans, borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`, background: '#fafafa', padding: '18px 24px' }}>
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 36, flexWrap: 'wrap', justifyContent: 'center' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0 }}>Trusted by teams at</span>
      {['Razorpay', 'Groww', 'Zepto', 'BrowserStack', 'Chargebee', 'Postman'].map((co) => (
        <span key={co} style={{ fontFamily: mono, fontSize: 13, fontWeight: 500, color: '#c8d3de' }}>{co}</span>
      ))}
    </div>
  </div>
);

// ─── Why us ───────────────────────────────────────────────────────────────────
const WhyUs: React.FC = () => {
  const rows = [
    { metric: 'Live pair-coding environment', us: true, hr: false, hv: false },
    { metric: 'Tests team collaboration & synergy', us: true, hr: false, hv: false },
    { metric: 'Shared code workspace for candidates', us: true, hr: false, hv: false },
    { metric: 'Plagiarism-resistant by design', us: true, hr: true, hv: false },
    { metric: 'Real-time communication signal', us: true, hr: false, hv: false },
    { metric: 'Custom DSA problem sets', us: true, hr: true, hv: false },
    { metric: 'Full session replay & review', us: true, hr: false, hv: false },
    { metric: 'Standard isolated online tests', us: true, hr: true, hv: true },
  ];
  const Check = ({ filled }: { filled: boolean }) => (
    <span style={{
      width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: filled ? cyan : '#f1f5f9', flexShrink: 0,
    }}>
      {filled
        ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        : <span style={{ width: 8, height: 1.5, background: '#d1d5db', borderRadius: 2, display: 'block' }} />}
    </span>
  );
  return (
    <section id="why-us" style={{ fontFamily: sans, background: '#fff', padding: '88px 24px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <FadeIn>
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontFamily: mono, fontSize: 11, fontWeight: 500, color: cyan, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>Why CodePvP</div>
            <h2 style={{ fontSize: 'clamp(1.7rem, 3.2vw, 2.6rem)', fontWeight: 700, color: ink, letterSpacing: '-0.025em', lineHeight: 1.2, margin: '0 0 14px' }}>
              Other tools test isolated logic.<br />We test real teamwork.
            </h2>
            <p style={{ fontSize: 15, color: muted, maxWidth: 500, lineHeight: 1.75, margin: 0 }}>
              Standard hiring platforms just give you generic online tests or interviews. CodePvP’s beta lets you pair candidates together to see their true collaborative power and coding skills in action.
            </p>
          </div>
        </FadeIn>
        <FadeIn delay={80}>
          <div style={{ border: `1px solid ${border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 130px 130px', background: '#f8fafc', borderBottom: `1px solid ${border}` }}>
              <div style={{ padding: '12px 20px', fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Feature</div>
              {[{ name: 'CodePvP', hl: true }, { name: 'HackerRank', hl: false }, { name: 'HireVue', hl: false }].map(({ name, hl }) => (
                <div key={name} style={{ padding: '12px 8px', textAlign: 'center', fontSize: 12, fontWeight: 600, fontFamily: mono, color: hl ? cyan : '#94a3b8', background: hl ? '#f0f9ff' : 'transparent', borderLeft: `1px solid ${border}` }}>
                  {hl && <div style={{ fontSize: 9, color: '#7dd3fc', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>← you</div>}
                  {name}
                </div>
              ))}
            </div>
            {rows.map((row, i) => (
              <div key={row.metric} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 130px 130px', borderBottom: i < rows.length - 1 ? '1px solid #f8fafc' : 'none', background: i % 2 ? '#fafafa' : '#fff' }}>
                <div style={{ padding: '12px 20px', fontSize: 14, color: '#334155' }}>{row.metric}</div>
                {[{ v: row.us, hl: true }, { v: row.hr, hl: false }, { v: row.hv, hl: false }].map(({ v, hl }, j) => (
                  <div key={j} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', borderLeft: '1px solid #f1f5f9', background: hl ? '#f0f9ff' : 'transparent', padding: '10px 0' }}>
                    <Check filled={v} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

// ─── How it works ─────────────────────────────────────────────────────────────
const HowItWorks: React.FC = () => {
  const steps = [
    { num: '01', title: 'Setup the pair challenge', body: 'Define the role, pick a DSA problem from our library or upload your own, and generate a session link. Ditch the boring automated tests.', tag: 'Setup', tc: '#7c3aed', tb: '#f5f3ff' },
    { num: '02', title: 'Candidates code together', body: 'Two candidates are put into a shared coding environment. They must communicate, collaborate, and solve the problem together under a single time limit.', tag: 'Live', tc: cyan, tb: '#f0f9ff' },
    { num: '03', title: 'Evaluate the teamwork', body: "Watch the dynamic flow in real time — see who leads, how they divide the logic, and how they debug as a team. Observe live or review the replay.", tag: 'Real-time', tc: '#d97706', tb: '#fffbeb' },
    { num: '04', title: 'Hire the best communicators', body: 'Get a comprehensive report on both coding proficiency and collaborative power. Interview the engineers who have already proven they are great teammates.', tag: 'Results', tc: '#059669', tb: '#f0fdf4' },
  ];
  return (
    <section id="how-it-works" style={{ fontFamily: sans, background: '#f8fafc', padding: '88px 24px', borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}` }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <FadeIn>
          <div style={{ marginBottom: 56 }}>
            <div style={{ fontFamily: mono, fontSize: 11, fontWeight: 500, color: cyan, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>Process</div>
            <h2 style={{ fontSize: 'clamp(1.7rem, 3.2vw, 2.6rem)', fontWeight: 700, color: ink, letterSpacing: '-0.025em', lineHeight: 1.2, margin: 0 }}>
              From job post to perfect team fit<br />in a single session.
            </h2>
          </div>
        </FadeIn>
        {steps.map((s, i) => (
          <FadeIn key={s.num} delay={i * 70}>
            <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr', gap: 20, padding: '28px 0', borderBottom: i < steps.length - 1 ? `1px solid ${border}` : 'none' }}>
              <div style={{ fontFamily: mono, fontSize: 26, fontWeight: 500, color: '#e2e8f0', lineHeight: 1, paddingTop: 3 }}>{s.num}</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: ink, margin: 0 }}>{s.title}</h3>
                  <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 500, color: s.tc, background: s.tb, padding: '3px 8px', borderRadius: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.tag}</span>
                </div>
                <p style={{ fontSize: 14, color: muted, lineHeight: 1.75, margin: 0 }}>{s.body}</p>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
};

// ─── Features ────────────────────────────────────────────────────────────────
const Features: React.FC = () => {
  const feats = [
    { title: 'Live Pair-Coding', body: 'Put 2 candidates in a shared environment to solve complex DSA problems, testing both logic and teamwork at once.', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { title: 'Communication Signal', body: 'Go beyond syntax. Assess how candidates articulate their thought process and adapt to their partner’s ideas.', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
    { title: 'Custom DSA Sets', body: 'Use our curated library or upload proprietary challenges specific to your tech stack and domain logic.', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> },
    { title: 'Collaborative Replay', body: "Watch the entire session keystroke-by-keystroke. Understand the team dynamics and debugging workflow, not just the output.", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg> },
    { title: 'Joint Evaluation Export', body: 'Download a full report detailing both individual contribution and the candidates’ ability to elevate their partner.', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
    { title: 'Live Proctoring', body: 'Tab switches, copy-paste events, and suspicious timing patterns are automatically flagged during the joint session.', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  ];
  return (
    <section style={{ fontFamily: sans, background: '#fff', padding: '88px 24px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <FadeIn>
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontFamily: mono, fontSize: 11, fontWeight: 500, color: cyan, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>Platform</div>
            <h2 style={{ fontSize: 'clamp(1.7rem, 3.2vw, 2.6rem)', fontWeight: 700, color: ink, letterSpacing: '-0.025em', lineHeight: 1.2, margin: 0 }}>Everything a hiring team needs.</h2>
          </div>
        </FadeIn>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(255px, 1fr))', border: `1px solid ${border}`, borderRadius: 14, overflow: 'hidden' }}>
          {feats.map((f, i) => (
            <FadeIn key={f.title} delay={i * 55}>
              <div style={{ padding: '26px 22px', borderRight: `1px solid ${border}`, borderBottom: `1px solid ${border}`, transition: 'background 0.15s', cursor: 'default' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f0f9ff', color: cyan, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: ink, margin: '0 0 7px' }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: muted, lineHeight: 1.65, margin: 0 }}>{f.body}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Testimonial ──────────────────────────────────────────────────────────────
const Testimonial: React.FC = () => (
  <section style={{ fontFamily: sans, background: '#f8fafc', borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`, padding: '72px 24px' }}>
    <FadeIn>
      <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginBottom: 22 }}>
          {[...Array(5)].map((_, i) => <svg key={i} width="15" height="15" viewBox="0 0 16 16" fill="#f59e0b"><path d="M8 1l1.8 3.6L14 5.3l-3 2.9.7 4.1L8 10.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7z" /></svg>)}
        </div>
        <blockquote style={{ fontSize: 17, fontWeight: 400, color: '#1e293b', lineHeight: 1.78, margin: '0 0 28px', fontStyle: 'italic' }}>
          "We were tired of standard online tests that told us nothing about cultural fit. CodePvP’s pair-coding beta let us see exactly how candidates collaborate to solve hard DSA problems. It made our hiring decisions obvious."
        </blockquote>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 11 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono, fontSize: 11, fontWeight: 500, color: cyan }}>SK</div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: ink }}>Siddharth K.</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Head of Engineering, Series B startup</div>
          </div>
        </div>
      </div>
    </FadeIn>
  </section>
);

// ─── Pricing ──────────────────────────────────────────────────────────────────
const Pricing: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    { 
      name: 'Starter', 
      price: isAnnual ? '₹10,000' : '₹15,000', 
      per: '/ month', 
      desc: isAnnual ? 'Billed annually at ₹1,20,000. For single users.' : 'Billed monthly. For single users.', 
      features: [
        '1 User (Hiring Person)', 
        '100 pair-coding sessions', 
        '200 solo test sessions', 
        'Screen access + interview',
        '2000+ library & custom questions', 
        'Malpractice detection', 
        'Hiring dashboard & Mail sending'
      ], 
      cta: 'Get started', 
      hl: false 
    },
    { 
      name: 'Pro', 
      price: isAnnual ? '₹20,000' : '₹25,000', 
      per: '/ month', 
      desc: isAnnual ? 'Billed annually at ₹2,40,000. AI-powered scaling.' : 'Billed monthly. AI-powered scaling.', 
      features: [
        'Everything in Starter', 
        '100 pair-coding sessions', 
        '400 solo test sessions', 
        'Advanced AI cheat detection', 
        'Live AI proctoring', 
        'Full ATS handling'
      ], 
      cta: 'Start free trial', 
      hl: true 
    },
    { 
      name: 'Enterprise', 
      price: 'Custom', 
      per: '', 
      desc: 'White-label, SSO, dedicated infra, SLAs.', 
      features: [
        'Custom Choice of services', 
        'Custom number of candidates',
        'White-label branding', 
        'SSO / SAML integration', 
        'Dedicated infrastructure', 
        'Custom SLA & Success manager'
      ], 
      cta: 'Talk to us', 
      hl: false 
    },
  ];

  return (
    <section id="pricing" style={{ fontFamily: sans, background: '#fff', padding: '88px 24px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontFamily: mono, fontSize: 11, fontWeight: 500, color: cyan, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>Pricing</div>
            <h2 style={{ fontSize: 'clamp(1.7rem, 3.2vw, 2.6rem)', fontWeight: 700, color: ink, letterSpacing: '-0.025em', lineHeight: 1.2, margin: '0 0 10px' }}>Straightforward. Built for scale.</h2>
            <p style={{ fontSize: 15, color: muted, margin: 0 }}>Choose the plan that fits your hiring velocity.</p>
          </div>
        </FadeIn>

        {/* Billing Toggle */}
        <FadeIn delay={40}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginBottom: 48 }}>
            <span style={{ fontSize: 15, color: isAnnual ? muted : ink, fontWeight: isAnnual ? 400 : 500, transition: 'color 0.2s' }}>Monthly</span>
            <button 
              type="button"
              onClick={() => setIsAnnual(!isAnnual)}
              style={{
                width: 52, height: 28, borderRadius: 14, background: cyan, border: 'none', 
                position: 'relative', cursor: 'pointer', transition: 'background 0.2s', padding: 0
              }}
            >
              <span style={{
                position: 'absolute', top: 3, left: isAnnual ? 27 : 3, width: 22, height: 22, 
                borderRadius: '50%', background: '#fff', transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }} />
            </button>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, color: isAnnual ? ink : muted, fontWeight: isAnnual ? 500 : 400, transition: 'color 0.2s' }}>
              Annually
              <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, color: '#059669', background: '#d1fae5', padding: '3px 8px', borderRadius: 999, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Save 20-33%
              </span>
            </span>
          </div>
        </FadeIn>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(255px, 1fr))', gap: 16 }}>
          {plans.map((p, i) => (
            <FadeIn key={p.name} delay={i * 70}>
              <div style={{
                borderRadius: 14, padding: '26px 22px', display: 'flex', flexDirection: 'column', position: 'relative',
                border: p.hl ? `2px solid ${cyan}` : `1px solid ${border}`,
                background: p.hl ? '#f0f9ff' : '#fff',
                boxShadow: p.hl ? `0 4px 20px rgba(8,145,178,0.10)` : '0 1px 4px rgba(0,0,0,0.04)',
                height: '100%', boxSizing: 'border-box'
              }}>
                {p.hl && (
                  <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)' }}>
                    <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 500, color: '#fff', background: cyan, padding: '4px 12px', borderRadius: 999, whiteSpace: 'nowrap' }}>Most popular</span>
                  </div>
                )}
                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 500, color: '#94a3b8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>{p.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                    <span style={{ fontFamily: mono, fontSize: 34, fontWeight: 500, color: p.hl ? cyan : ink, lineHeight: 1 }}>{p.price}</span>
                    {p.per && <span style={{ fontSize: 13, color: '#94a3b8' }}>{p.per}</span>}
                  </div>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, minHeight: 36 }}>{p.desc}</p>
                </div>
                <ul style={{ listStyle: 'none', margin: '0 0 24px', padding: 0, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  {p.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13, color: '#334155', lineHeight: 1.4 }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginTop: 2, flexShrink: 0 }}><path d="M2 7l3.5 3.5 6.5-6.5" stroke={cyan} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="#contact" style={{
                  fontFamily: mono, display: 'block', textAlign: 'center',
                  padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
                  textDecoration: 'none', transition: 'all 0.15s',
                  ...(p.hl ? { background: cyan, color: '#fff', boxShadow: `0 2px 10px rgba(8,145,178,0.22)` } : { background: 'transparent', color: '#374151', border: `1px solid ${border}` }),
                }}
                  onMouseEnter={e => { if (p.hl) { e.currentTarget.style.background = cyanDark; } else { e.currentTarget.style.borderColor = '#9ca3af'; } }}
                  onMouseLeave={e => { if (p.hl) { e.currentTarget.style.background = cyan; } else { e.currentTarget.style.borderColor = border; } }}>
                  {p.cta}
                </a>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Contact ──────────────────────────────────────────────────────────────────
const Contact: React.FC = () => {
  const [form, setForm] = useState({ name: '', company: '', email: '', size: '', message: '' });
  const [done, setDone] = useState(false);
  const inp: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', background: '#fff',
    border: `1px solid ${border}`, borderRadius: 8, padding: '10px 13px',
    fontSize: 14, color: ink, fontFamily: sans, outline: 'none', transition: 'border-color 0.15s',
  };
  const lbl: React.CSSProperties = { fontFamily: mono, fontSize: 11, fontWeight: 500, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 };
  return (
    <section id="contact" style={{ fontFamily: sans, background: '#f8fafc', borderTop: `1px solid ${border}`, padding: '88px 24px' }}>
      <div style={{ maxWidth: 940, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'start' }}>
        <FadeIn>
          <div>
            <div style={{ fontFamily: mono, fontSize: 11, fontWeight: 500, color: cyan, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>Get in touch</div>
            <h2 style={{ fontSize: 'clamp(1.7rem, 3vw, 2.4rem)', fontWeight: 700, color: ink, letterSpacing: '-0.025em', lineHeight: 1.2, margin: '0 0 14px' }}>
              Let's run a pair-coding<br />session for your team.
            </h2>
            <p style={{ fontSize: 14, color: muted, lineHeight: 1.78, margin: '0 0 32px' }}>
              30-minute demo. We'll walk you through the collaborative beta platform, design your first pair-coding challenge, and show you the full candidate experience.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {['Custom DSA problem set scoped to your role', 'Pair-coding candidate experience walkthrough', 'Live evaluation dashboard', 'ATS integration and export options'].map((item) => (
                <div key={item} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke={cyan} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <span style={{ fontSize: 14, color: '#334155', lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 36, paddingTop: 28, borderTop: `1px solid ${border}` }}>
              <div style={{ fontFamily: mono, fontSize: 10, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Or email us directly</div>
              <a href="mailto:hiring@codepvp.tech" style={{ fontFamily: mono, fontSize: 13, color: cyan, textDecoration: 'none' }}>hiring@codepvp.tech</a>
            </div>
          </div>
        </FadeIn>
        <FadeIn delay={100}>
          <div style={{ background: '#fff', border: `1px solid ${border}`, borderRadius: 14, padding: 26, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            {done ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-8" stroke={cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: ink, margin: '0 0 8px' }}>You're on the list.</h3>
                <p style={{ fontSize: 14, color: muted, margin: 0 }}>We'll reach out within 24 hours to schedule your demo.</p>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setDone(true); }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[{ key: 'name', label: 'Name', placeholder: 'Priya Sharma', type: 'text' }, { key: 'company', label: 'Company', placeholder: 'Acme Corp', type: 'text' }].map(({ key, label, placeholder, type }) => (
                    <div key={key}>
                      <label style={lbl}>{label}</label>
                      <input type={type} required placeholder={placeholder} value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inp}
                        onFocus={e => (e.target.style.borderColor = cyan)} onBlur={e => (e.target.style.borderColor = border)} />
                    </div>
                  ))}
                </div>
                <div>
                  <label style={lbl}>Work email</label>
                  <input type="email" required placeholder="priya@company.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp}
                    onFocus={e => (e.target.style.borderColor = cyan)} onBlur={e => (e.target.style.borderColor = border)} />
                </div>
                <div>
                  <label style={lbl}>Hiring volume</label>
                  <select value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} style={{ ...inp, appearance: 'none' as any }}
                    onFocus={e => (e.target.style.borderColor = cyan)} onBlur={e => (e.target.style.borderColor = border)}>
                    <option value="" disabled>Select range</option>
                    <option>1–10 engineers / year</option>
                    <option>10–50 engineers / year</option>
                    <option>50–200 engineers / year</option>
                    <option>200+ engineers / year</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Tell us about the role</label>
                  <textarea rows={3} placeholder="We want to run pair-coding sessions for 3 backend roles..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                    style={{ ...inp, resize: 'none' } as any}
                    onFocus={e => (e.target.style.borderColor = cyan)} onBlur={e => (e.target.style.borderColor = border)} />
                </div>
                <button type="submit" style={{
                  fontFamily: mono, fontSize: 14, fontWeight: 500, color: '#fff', background: cyan,
                  border: 'none', borderRadius: 8, padding: '12px 0', cursor: 'pointer',
                  boxShadow: `0 2px 12px rgba(8,145,178,0.22)`, transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = cyanDark; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = cyan; e.currentTarget.style.transform = 'none'; }}>
                  Book my demo →
                </button>
                <p style={{ fontSize: 12, color: '#cbd5e1', textAlign: 'center', margin: 0 }}>No spam. No sales pipeline. Just a demo.</p>
              </form>
            )}
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

// ─── Footer ───────────────────────────────────────────────────────────────────
const Footer: React.FC = () => (
  <footer style={{ fontFamily: sans, background: '#fff', borderTop: `1px solid ${border}`, padding: '24px 24px' }}>
    <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: mono, fontSize: 14, fontWeight: 500, color: cyan }}>CodePvP</span>
        <span style={{ fontFamily: mono, fontSize: 11, color: '#d1d5db' }}>/ Hiring</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
        {[{ l: 'Main platform', h: 'https://codepvp.tech' }, { l: 'hiring@codepvp.tech', h: 'mailto:hiring@codepvp.tech' }].map(({ l, h }) => (
          <a key={l} href={h} style={{ fontSize: 12, color: '#94a3b8', textDecoration: 'none' }}>{l}</a>
        ))}
        <span style={{ fontSize: 12, color: '#d1d5db' }}>&copy; {new Date().getFullYear()} CodePvP</span>
      </div>
    </div>
  </footer>
);

// ─── Page ─────────────────────────────────────────────────────────────────────
const Hiring: React.FC = () => (
  <>
    <FontLoader />
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <Nav />
      <Hero />
      <LogoStrip />
      <WhyUs />
      <HowItWorks />
      <Features />
      <Testimonial />
      <Pricing />
      <Contact />
      <Footer />
    </div>
  </>
);

export default Hiring;