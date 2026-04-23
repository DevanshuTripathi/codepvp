import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { db } from '../../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import LoadingScreen from './components/LoadingScreen';
import { socket } from '../utils/socket';

// ─── Types ────────────────────────────────────────────────────────────────────

export type GameMode = '1v1' | '2v2' | '3v3' | '4v4';

export interface RoomSettings {
  mode: 'normal' | 'debug';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  size: GameMode;
  questions: number;
  time: number;
}

interface activeRoom {
  name: string;
  numberOfPeople: number;
  public: boolean;
  roomId: string;
}

interface PartyMember {
  username: string;
  avatar?: string;
  ready: boolean;
}

interface UserData {
  username?: string;
  avatar?: string;
  rating?: number;
  skillLevel?: string;
  questionsSolved?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MODES: GameMode[] = ['1v1', '2v2', '3v3', '4v4'];

function generatePartyCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const InviteSlot: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
  <div className="flex flex-col items-center gap-2">
    <button
      onClick={onClick}
      className="w-36 h-36 flex items-center justify-center rounded transition-all duration-200 group"
      style={{ border: '1px dashed rgba(100,116,139,0.2)', background: 'transparent' }}
    >
      <svg
        width="18" height="18" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
        className="text-slate-700 group-hover:text-slate-500 transition-colors duration-200"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
    <span className="text-[10px] uppercase tracking-widest text-slate-700">Invite</span>
  </div>
);

const PartyMemberSlot: React.FC<{ member: PartyMember }> = ({ member }) => {
  const initials = member.username.slice(0, 2).toUpperCase();
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-36 h-36 flex items-center justify-center relative rounded overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid rgba(6,182,212,0.2)',
        }}
      >
        {member.avatar ? (
          <img src={member.avatar} alt={member.username} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl font-bold text-white">{initials}</span>
        )}
        <div
          className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-emerald-400"
          style={{ boxShadow: '0 0 4px rgba(52,211,153,0.6)' }}
        />
      </div>
      <span className="text-slate-400 text-xs font-medium">{member.username}</span>
    </div>
  );
};

const PlayerCard: React.FC<{ username: string; userData?: UserData | null }> = ({ username, userData }) => {
  const initials = (userData?.username || username).slice(0, 2).toUpperCase();
  const displayName = userData?.username || username;
  const rating = userData?.rating ?? null;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="w-40 h-40 flex items-center justify-center relative rounded overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid rgba(6,182,212,0.3)',
          boxShadow: '0 0 20px rgba(6,182,212,0.08)',
        }}
      >
        {userData?.avatar ? (
          <img src={userData.avatar} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl font-bold text-white">{initials}</span>
        )}
        <div
          className="absolute bottom-2 right-2 w-2.5 h-2.5 rounded-full bg-emerald-400"
          style={{ boxShadow: '0 0 5px rgba(52,211,153,0.6)' }}
        />
      </div>
      <div className="text-center">
        <p className="text-white font-semibold text-lg">{displayName}</p>
        <div className="flex items-center justify-center mt-0.5">
          {rating !== null && (
            <>
              <p className="text-cyan-500 text-xs font-semibold">{rating} ELO</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Join Party Modal ─────────────────────────────────────────────────────────

const JoinPartyModal: React.FC<{
  partyCode: string;
  onClose: () => void;
  onJoin: (code: string) => void;
}> = ({ partyCode, onClose, onJoin }) => {
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(partyCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-sm mx-4 rounded-md overflow-hidden"
        style={{ background: '#0d1424', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, #06b6d4 50%, transparent)' }} />
        <div className="p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-white font-bold text-lg">Party</h2>
            <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors p-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Your party code */}
          <div className="mb-5">
            <p className="text-slate-600 text-xs uppercase tracking-widest mb-2">Your Party Code</p>
            <div
              className="flex items-center justify-between px-4 py-3 rounded"
              style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)' }}
            >
              <span className="text-cyan-300 font-bold text-xl tracking-[0.25em]">{partyCode}</span>
              <button
                onClick={handleCopy}
                className="text-xs font-semibold uppercase tracking-wider transition-colors duration-150"
                style={{ color: copied ? '#34d399' : '#64748b' }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-slate-700 text-xs mt-2">Share this code so others can join your party</p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <span className="text-slate-700 text-xs">or join another</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Join party input */}
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="Enter party code"
              maxLength={6}
              className="w-full bg-transparent py-2.5 px-3 text-white text-sm rounded placeholder:text-slate-700 focus:outline-none text-center tracking-[0.2em]"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            />
            <button
              onClick={() => { if (inputCode.length === 6) onJoin(inputCode); }}
              disabled={inputCode.length < 6}
              className="w-full py-3 text-sm font-bold uppercase tracking-widest rounded transition-opacity disabled:opacity-30"
              style={{ background: '#06b6d4', color: '#050d1a' }}
            >
              Join Party
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Custom Room Modal ────────────────────────────────────────────────────────

const CustomRoomModal: React.FC<{
  onClose: () => void;
  onCreateRoom: (s: RoomSettings) => void;
  onJoinRoom: (code: string) => void;
  activeRooms: activeRoom[];
  onJoinActiveRoom: (id: string) => void;
}> = ({ onClose, onCreateRoom, onJoinRoom, activeRooms, onJoinActiveRoom }) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [code, setCode] = useState('');
  const [settings, setSettings] = useState<RoomSettings>({
    mode: 'normal', difficulty: 'Easy', size: '2v2', questions: 2, time: 15,
  });
  const set = (key: keyof RoomSettings, value: any) =>
    setSettings((p) => ({ ...p, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md mx-4 rounded-md overflow-hidden"
        style={{ background: '#0d1424', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, #06b6d4 50%, transparent)' }} />
        <div className="p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-white font-bold text-lg">Custom Room</h2>
            <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors p-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="flex mb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {(['create', 'join'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`pb-3 mr-6 text-xs font-semibold uppercase tracking-widest transition-all border-b-2 -mb-px ${
                  tab === t ? 'text-cyan-400 border-cyan-400' : 'text-slate-600 border-transparent hover:text-slate-400'
                }`}
              >
                {t === 'create' ? 'Create' : 'Join'}
              </button>
            ))}
          </div>

          {tab === 'create' && (
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-slate-600 text-xs uppercase tracking-widest mb-2.5">Difficulty</p>
                <div className="flex gap-2">
                  {(['Easy', 'Medium', 'Hard'] as const).map((d) => (
                    <button key={d} onClick={() => set('difficulty', d)}
                      className={`flex-1 py-2 text-sm font-semibold rounded transition-all duration-150 ${
                        settings.difficulty === d ? 'bg-cyan-500 text-white' : 'text-slate-500 hover:text-white'
                      }`}
                      style={settings.difficulty !== d ? { border: '1px solid rgba(255,255,255,0.07)' } : {}}
                    >{d}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2.5">
                  <p className="text-slate-600 text-xs uppercase tracking-widest">Questions</p>
                  <p className="text-cyan-400 text-xs font-semibold">{settings.questions}</p>
                </div>
                <input type="range" min="1" max="4" step="1" value={settings.questions}
                  onChange={(e) => set('questions', parseInt(e.target.value))}
                  className="w-full h-1 cursor-pointer rounded-full appearance-none"
                  style={{ accentColor: '#06b6d4', background: 'rgba(6,182,212,0.12)' }}
                />
              </div>
              <div>
                <div className="flex justify-between mb-2.5">
                  <p className="text-slate-600 text-xs uppercase tracking-widest">Time Limit</p>
                  <p className="text-cyan-400 text-xs font-semibold">{settings.time} min</p>
                </div>
                <input type="range" min="5" max="60" step="5" value={settings.time}
                  onChange={(e) => set('time', parseInt(e.target.value))}
                  className="w-full h-1 cursor-pointer rounded-full appearance-none"
                  style={{ accentColor: '#06b6d4', background: 'rgba(6,182,212,0.12)' }}
                />
              </div>
              <button onClick={() => onCreateRoom(settings)}
                className="w-full py-3 text-sm font-bold uppercase tracking-widest rounded mt-1 hover:opacity-90 transition-opacity"
                style={{ background: '#06b6d4', color: '#050d1a' }}
              >Create Room</button>
            </div>
          )}

          {tab === 'join' && (
            <div className="flex flex-col gap-4">
              {activeRooms.length > 0 && (
                <>
                  <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                    {activeRooms.map((room) => (
                      <div key={room.roomId} className="flex justify-between items-center px-3 py-2.5 rounded"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <div>
                          <p className="text-white text-sm font-semibold">#{room.roomId}</p>
                          <p className="text-slate-600 text-xs">{room.numberOfPeople}/8 players</p>
                        </div>
                        <button onClick={() => onJoinActiveRoom(room.roomId)}
                          className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded"
                          style={{ background: '#06b6d4', color: '#050d1a' }}
                        >Join</button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    <span className="text-slate-700 text-xs">or</span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  </div>
                </>
              )}
              <input type="text" value={code} onChange={(e) => setCode(e.target.value)}
                placeholder="Enter room code"
                className="w-full bg-transparent py-2.5 px-3 text-white text-sm rounded placeholder:text-slate-700 focus:outline-none"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              />
              <button onClick={() => onJoinRoom(code)}
                className="w-full py-3 text-sm font-bold uppercase tracking-widest rounded hover:opacity-90 transition-opacity"
                style={{ background: '#7c3aed', color: 'white' }}
              >Join Room</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const MultiPlayer: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('1v1');
  const [partyCode, setPartyCode] = useState<string>(generatePartyCode);
  const [partyMembers, setPartyMembers] = useState<PartyMember[]>([]);
  const [partyLeader, setPartyLeader] = useState<string>('');
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [activeRooms, setActiveRooms] = useState<activeRoom[]>([]);

  const navigate = useNavigate();
  const { user, loading, userData } = useUser();
  const currentUserName = userData?.username || user?.displayName || user?.email?.split('@')[0] || 'Agent';

  const totalSlots = parseInt(selectedMode[0]);
  const openSlots = totalSlots - 1 - partyMembers.length;

  useEffect(() => { if (!user && !loading) navigate('/login'); });

  useEffect(() => {
    if (currentUserName) {
      socket.emit('registerUser', { username: currentUserName });
      // Set yourself as leader initially
      setPartyLeader(currentUserName);
    }
  }, [currentUserName]);

  useEffect(() => {
    // Create the party on the server once we have a username
    if (currentUserName) {
      socket.emit('createParty', { partyCode, username: currentUserName, avatar: userData?.avatar });
    }
  }, [currentUserName]);

  useEffect(() => {
    socket.on('matchFound', (data: any) => {
      navigate(`/room/${data.roomId}/problemset/team/${data.team}`);
    });

    socket.on('partyUpdated', (data: { partyCode: string, leader: string, mode: GameMode, members: PartyMember[] }) => {
      setPartyCode(data.partyCode);
      setPartyLeader(data.leader);
      setSelectedMode(data.mode);
      setPartyMembers(data.members.filter(m => m.username !== currentUserName));
    });

    socket.on('partyJoinError', (data: { message: string }) => {
      alert(data.message); // you can replace with a toast
    });

    return () => {
      socket.off('matchFound');
      socket.off('partyUpdated');
      socket.off('partyJoinError');
    };
  }, [currentUserName]);

  const handleQuickBattle = () => {
    setIsMatchmaking(true);
    const allMembers = [currentUserName, ...partyMembers.map(m => m.username)];
    socket.emit('joinQueue', { username: currentUserName, party: allMembers, mode: selectedMode });
  };

  const handleCancelMatchmaking = () => {
    socket.emit('leaveQueue', { username: currentUserName, mode: selectedMode });
    setIsMatchmaking(false);
  };

  const handleJoinParty = (code: string) => {
    socket.emit('joinParty', { partyCode: code, username: currentUserName, avatar: userData?.avatar });
    setShowPartyModal(false);
  };

  const handleCreateRoom = async (roomSettings: RoomSettings) => {
    setShowCustomModal(false);
    setIsCreatingRoom(true);
    const roomId = Math.floor(Math.random() * 100000) + 100000;
    try {
      await setDoc(doc(db, 'rooms', roomId.toString()), roomSettings);
      await new Promise((r) => setTimeout(r, 1500));
      navigate(`/room/${roomId}`);
    } catch { setIsCreatingRoom(false); }
  };

  const handleJoinRoom = async (code: string) => {
    setIsJoiningRoom(true);
    await new Promise((r) => setTimeout(r, 1500));
    navigate(`/room/${code}`);
  };

  const handleJoinActiveRoom = async (id: string) => {
    setIsJoiningRoom(true);
    await new Promise((r) => setTimeout(r, 1500));
    navigate(`/room/${id}`);
  };

  const getActiveRooms = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/rooms`);
      const json = await res.json();
      const arr: activeRoom[] = [];
      for (const key in json) {
        if (json[key].public !== true || json[key].status !== 'waiting') continue;
        const a = json[key].teamA.filter((x: any) => x !== null);
        const b = json[key].teamB.filter((x: any) => x !== null);
        arr.push({ roomId: key, name: 'Room', public: true, numberOfPeople: a.length + b.length });
      }
      setActiveRooms(arr);
    } catch { /* silent */ }
  };

  if (isCreatingRoom) return <LoadingScreen message="Creating Room" />;
  if (isJoiningRoom) return <LoadingScreen message="Joining Room" />;

  // Build the party row: [my card] + [party member cards] + [open invite slots]
  const partyRow = () => {
    const slots: React.ReactNode[] = [];

    // My card always center-ish — put at front
    slots.push(<PlayerCard key="me" username={currentUserName} userData={userData} />);

    // Party members who joined
    partyMembers.forEach((member) => {
      slots.push(<PartyMemberSlot key={member.username} member={member} />);
    });

    // Open invite slots
    for (let i = 0; i < Math.max(0, openSlots); i++) {
      slots.push(<InviteSlot key={`open-${i}`} onClick={() => setShowPartyModal(true)} />);
    }

    return slots;
  };

  const isLeader = partyLeader === currentUserName;

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ background: '#080e1a' }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fu  { animation: fadeUp 0.35s ease forwards; }
        .fu2 { animation: fadeUp 0.35s 0.15s ease both; }

        @keyframes blink {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 1; }
        }
        .sd  { animation: blink 1.1s ease-in-out infinite; }
        .sd2 { animation-delay: 0.18s; }
        .sd3 { animation-delay: 0.36s; }
      `}</style>

      {/* Nav */}
      <nav
        className="flex items-center justify-between px-8 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-medium"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>

        <div className="flex items-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {[
            { label: 'Quick Play', active: true, action: undefined },
            { label: 'Custom Room', active: false, action: () => { getActiveRooms(); setShowCustomModal(true); } },
          ].map(({ label, active, action }) => (
            <button
              key={label}
              onClick={action}
              className={`px-6 py-4 text-xs font-semibold uppercase tracking-widest transition-colors border-b-2 -mb-px ${
                active ? 'text-white border-cyan-400' : 'text-slate-600 border-transparent hover:text-slate-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Party code pill */}
        <button
          onClick={() => setShowPartyModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-all duration-150 group"
          style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="text-slate-500 group-hover:text-slate-300 transition-colors"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span className="text-slate-500 group-hover:text-slate-300 transition-colors">Party</span>
          <span className="text-cyan-500 font-bold tracking-widest">{partyCode}</span>
        </button>
      </nav>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-between py-10 px-6">

        {/* Mode selector */}
        <div className="flex flex-col items-center gap-8 w-full fu">
          {/* Mode pills */}
          <div
            className="flex items-center gap-1 p-1 rounded-md"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {MODES.map((mode) => (
              <button
                key={mode}
                onClick={() => { 
                  if (isLeader) {
                    socket.emit("changePartyMode", { partyCode, username: currentUserName, mode });
                  }
                }}
                disabled={isMatchmaking || !isLeader}
                className="px-5 py-1.5 text-xs font-bold uppercase tracking-widest rounded transition-all duration-150 disabled:cursor-not-allowed"
                style={{
                  background: selectedMode === mode ? '#06b6d4' : 'transparent',
                  color: selectedMode === mode ? '#050d1a' : '#475569',
                }}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Party row */}
          <div className="flex items-end justify-center gap-5">
            {partyRow()}
          </div>

          {/* Party size hint */}
          {totalSlots > 1 && (
            <p className="text-slate-700 text-xs">
              {1 + partyMembers.length}/{totalSlots} players in party
              {partyMembers.length === 0 && isLeader && (
                <button
                  onClick={() => setShowPartyModal(true)}
                  className="ml-2 text-cyan-600 hover:text-cyan-400 transition-colors underline underline-offset-2"
                >
                  Invite teammates
                </button>
              )}
            </p>
          )}
        </div>

        {/* Bottom action zone */}
        <div className="w-full max-w-lg fu2">
          <div
            className="flex items-center justify-center gap-10 py-4 mb-6"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            {[
              { label: 'Mode', value: selectedMode },
              { label: 'Region', value: 'Global' },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-slate-700 text-[10px] uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-cyan-400 text-sm font-semibold">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex items-stretch gap-3">
            {/* Custom */}
            <button
              onClick={() => { getActiveRooms(); setShowCustomModal(true); }}
              className="flex items-center gap-2 px-5 py-3.5 text-xs font-semibold uppercase tracking-widest text-slate-500 hover:text-white rounded transition-all duration-150"
              style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <line x1="3" y1="9" x2="9" y2="9" />
              </svg>
              Custom
            </button>

            {/* Find Match / Cancel */}
            {isMatchmaking ? (
              <button
                onClick={handleCancelMatchmaking}
                className="flex-1 py-3.5 text-sm font-bold uppercase tracking-widest rounded transition-all duration-200"
                style={{ background: 'transparent', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.2)' }}
                onMouseEnter={e => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.borderColor = 'rgba(239,68,68,0.4)';
                  b.style.color = '#f87171';
                  b.style.background = 'rgba(239,68,68,0.05)';
                }}
                onMouseLeave={e => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.borderColor = 'rgba(148,163,184,0.2)';
                  b.style.color = '#94a3b8';
                  b.style.background = 'transparent';
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="flex gap-1">
                    <span className="sd w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
                    <span className="sd sd2 w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
                    <span className="sd sd3 w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
                  </span>
                  <span>Cancel</span>
                </span>
              </button>
            ) : (
              <button
                onClick={handleQuickBattle}
                disabled={!isLeader}
                className="flex-1 py-3.5 text-sm font-bold uppercase tracking-widest rounded transition-all duration-200"
                style={{ background: '#06b6d4', color: '#050d1a' }}
                onMouseEnter={e => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.background = '#22d3ee';
                  b.style.boxShadow = '0 0 20px rgba(6,182,212,0.3)';
                }}
                onMouseLeave={e => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.background = '#06b6d4';
                  b.style.boxShadow = 'none';
                }}
              >
                {isLeader ? 'Find Match' : 'Waiting for Leader'}
              </button>
            )}

            {/* Practice */}
            <button
              className="flex items-center gap-2 px-5 py-3.5 text-xs font-semibold uppercase tracking-widest text-slate-600 hover:text-slate-400 rounded transition-all duration-150"
              style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Practice
            </button>
          </div>

          {isMatchmaking && (
            <p className="text-center text-slate-700 text-xs mt-4 tracking-wide">
              Searching for {selectedMode} match...
            </p>
          )}
        </div>
      </div>

      {showPartyModal && (
        <JoinPartyModal
          partyCode={partyCode}
          onClose={() => setShowPartyModal(false)}
          onJoin={handleJoinParty}
        />
      )}

      {showCustomModal && (
        <CustomRoomModal
          onClose={() => setShowCustomModal(false)}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          activeRooms={activeRooms}
          onJoinActiveRoom={handleJoinActiveRoom}
        />
      )}
    </div>
  );
};

export default MultiPlayer;