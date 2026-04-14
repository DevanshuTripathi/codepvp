import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, arrayUnion, deleteDoc, onSnapshot, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { useUser } from '../hooks/useUser';
import LoadingScreen from './components/LoadingScreen';
import { Flame, Users, Key, ShieldAlert, Gift, ArrowLeft, Swords, Clock, Trophy, Trash2, Play, Square, LogOut, Award } from 'lucide-react';
import { socket } from '../utils/socket';

interface Contest {
  id: string;
  name: string;
  description: string;
  status: string;
  rules: string;
  startDate: any;
  endDate: any;
  prizes: { rank: string; reward: string; badgeId?: string }[];
  badgesDistributed?: boolean; // Tracking distribution
}

interface Team {
  id: string;
  name: string;
  code: string;
  leaderId: string;
  members: string[]; // Array of user UIDs
  score?: number; // Added for leaderboard
  finishedAt?: any;
}

interface PlayerDetails {
  uid: string;
  username: string;
  avatar: string;
}

const Contest: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: userLoading, userData } = useUser();

  const [contest, setContest] = useState<Contest | null>(null);
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [leaderboard, setLeaderboard] = useState<Team[]>([]);
  const [playerDetails, setPlayerDetails] = useState<Record<string, PlayerDetails>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  // Forms state
  const [joinMode, setJoinMode] = useState<'idle' | 'create' | 'join'>('idle');
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');

  const [completed, setCompleted] = useState(false);

  const isAdmin = userData?.role === 'admin'; 

  useEffect(() => {
    if (!user && !userLoading) navigate("/login");
  }, [user, userLoading, navigate]);

  useEffect(() => {
    if (!id || !user) return;

    const unsubContest = onSnapshot(doc(db, "Contests", id), (docSnap) => {
      if (!docSnap.exists()) {
        alert("Arena not found!");
        navigate('/contests');
        return;
      }
      setContest({ id: docSnap.id, ...docSnap.data() } as Contest);
    });

    const fetchTeams = async () => {
      try {
        const teamsRef = collection(db, "Teams");
        const allTeamsQuery = query(teamsRef, where("contestId", "==", id));
        const allTeamsSnap = await getDocs(allTeamsQuery);
        
        const teamsData: Team[] = [];
        const uidsToFetch = new Set<string>();

        allTeamsSnap.forEach(docSnap => {
          const tData = { id: docSnap.id, ...docSnap.data() } as Team;
          teamsData.push(tData);
          
          if (tData.members.includes(user.uid)) {
            setUserTeam(tData);
          }
          
          tData.members.forEach(uid => uidsToFetch.add(uid));
        });

        teamsData.sort((a, b) => {
          if (b.score !== a.score) return (b.score || 0) - (a.score || 0);
          const aTime = a.finishedAt?.toMillis() || Infinity;
          const bTime = b.finishedAt?.toMillis() || Infinity;
          return aTime - bTime;
        });

        setLeaderboard(teamsData);

        if (uidsToFetch.size > 0) {
          const playerPromises = Array.from(uidsToFetch).map(uid => getDoc(doc(db, "users", uid)));
          const playerDocs = await Promise.all(playerPromises);
          
          const detailsMap: Record<string, PlayerDetails> = {};
          playerDocs.forEach(docSnap => {
            if (docSnap.exists()) {
              detailsMap[docSnap.id] = {
                uid: docSnap.id,
                username: docSnap.data().username || "Anon",
                avatar: docSnap.data().avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"
              };
            }
          });
          setPlayerDetails(detailsMap);
        }
      } catch (err) {
        console.error("Error loading deployment zone:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();

    return () => {
      unsubContest(); 
    };
  }, [id, user, navigate]);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const teamRef = doc(db, "Teams", userTeam?.id!);
        const teamSnap = await getDoc(teamRef);
        const teamData = teamSnap.data();
        if(teamData && "finishedAt" in teamData) {
          setCompleted(true);
        }
      } catch (err) {
        console.error("error while checking finish status", err);
      }
    }
    if (userTeam?.id) checkStatus();
  }, [userTeam?.id]);

  const injectCurrentUserDetails = () => {
    if (user && userData && !playerDetails[user.uid]) {
      setPlayerDetails(prev => ({
        ...prev,
        [user.uid]: {
          uid: user.uid,
          username: userData.username || "You",
          avatar: userData.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"
        }
      }));
    }
  };

  const generateTeamCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !id || !user) return;
    setActionLoading(true);

    try {
      const newCode = generateTeamCode();
      const teamData = {
        name: teamName,
        code: newCode,
        contestId: id,
        leaderId: user.uid,
        members: [user.uid],
        score: 0,
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, "Teams"), teamData);
      const newTeam = { id: docRef.id, ...teamData };
      
      injectCurrentUserDetails();
      setUserTeam(newTeam);
      setLeaderboard(prev => [...prev, newTeam].sort((a, b) => (b.score || 0) - (a.score || 0)));
      setJoinMode('idle');
    } catch (err) {
      console.error("Error creating squad:", err);
      alert("Failed to create squad.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamCode.trim() || !id || !user) return;
    setActionLoading(true);

    try {
      const teamsRef = collection(db, "Teams");
      const q = query(teamsRef, where("contestId", "==", id), where("code", "==", teamCode.trim().toUpperCase()));
      const teamSnap = await getDocs(q);

      if (teamSnap.empty) {
        alert("Invalid Squad Code. Check your intel and try again.");
        setActionLoading(false);
        return;
      }

      const matchedTeam = teamSnap.docs[0];
      const teamRef = doc(db, "Teams", matchedTeam.id);

      await updateDoc(teamRef, {
        members: arrayUnion(user.uid)
      });

      const updatedTeam = { id: matchedTeam.id, ...matchedTeam.data(), members: [...matchedTeam.data().members, user.uid] } as Team;
      
      injectCurrentUserDetails();
      setUserTeam(updatedTeam);
      
      setLeaderboard(prev => prev.map(t => t.id === updatedTeam.id ? updatedTeam : t));
      setJoinMode('idle');
    } catch (err) {
      console.error("Error joining squad:", err);
      alert("Failed to infiltrate squad.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!userTeam || !user || !id) return;
    if (!window.confirm("Are you sure you want to abandon your squad?")) return;
    
    setActionLoading(true);
    try {
      const teamRef = doc(db, "Teams", userTeam.id);
      
      if (userTeam.members.length === 1) {
        await deleteDoc(teamRef);
        setLeaderboard(prev => prev.filter(t => t.id !== userTeam.id));
      } else {
        await updateDoc(teamRef, {
          members: arrayRemove(user.uid)
        });
        setLeaderboard(prev => prev.map(t => {
          if (t.id === userTeam.id) {
            return { ...t, members: t.members.filter(uid => uid !== user.uid) };
          }
          return t;
        }));
      }
      
      setUserTeam(null);
      setJoinMode('idle');
    } catch (err) {
      console.error("Error leaving squad:", err);
      alert("Failed to abandon squad.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartContest = async () => {
    if (!window.confirm("Are you sure you want to open the arena? All registered operatives will be allowed to enter.")) return;
    
    try {
      socket.emit("startFFAContest", { 
        contestId: id, 
        adminName: userData?.username || "Admin", 
        durationMinutes: 10
      });

      await updateDoc(doc(db, "Contests", id!), { status: 'Ongoing', startDate: serverTimestamp() });
      
    } catch (err) {
      console.error(err);
      alert("Failed to start arena.");
    }
  };

  const handleEndContest = async () => {
    if (!window.confirm("Are you sure you want to end the bloodbath and finalize scores?")) return;
    try {
      await updateDoc(doc(db, "Contests", id!), { status: 'Completed' });
    } catch (err) {
      console.error(err);
      alert("Failed to end arena.");
    }
  };

  const handleKickTeam = async (teamId: string, teamName: string) => {
    if (!window.confirm(`Are you sure you want to annihilate squad "${teamName}" from the arena?`)) return;
    
    try {
      await deleteDoc(doc(db, "Teams", teamId));
      setLeaderboard(prev => prev.filter(t => t.id !== teamId));
      if (userTeam?.id === teamId) {
        setUserTeam(null);
      }
    } catch (err) {
      console.error("Error kicking team:", err);
      alert("Failed to execute kick command.");
    }
  };

  const handleDeployment = () => {
    setIsDeploying(true);
    const randomDelay = Math.floor(Math.random() * 2000);
    setTimeout(() => {
      navigate(`/room/${contest?.id}/problemset/team/${userTeam?.id}`);
    }, randomDelay);
  }

  // --- AUTOMATED BADGE DISTRIBUTION LOGIC ---
  const handleDistributeBadges = async () => {
    if (!window.confirm("Distribute badges based on current leaderboard? This action will permanently grant the badges and cannot be undone.")) return;
    setActionLoading(true);
    
    try {
      // Loop through the leaderboard to assign based on index (0 = 1st, 1 = 2nd, etc.)
      for (let i = 0; i < leaderboard.length; i++) {
        const team = leaderboard[i];
        const position = i + 1;

        const earnedBadges: string[] = [];

        contest?.prizes?.forEach(prize => {
          if (!prize.badgeId) return;

          const r = prize.rank.toLowerCase().trim();
          let matches = false;

          // Highly robust check against manual text inputs from AddContest
          if (position === 1 && (r === '1st' || r === '1' || r === 'winner')) matches = true;
          else if (position === 2 && (r === '2nd' || r === '2')) matches = true;
          else if (position === 3 && (r === '3rd' || r === '3')) matches = true;
          else if (position === 4 && (r === '4th' || r === '4')) matches = true;
          else if (position === 5 && (r === '5th' || r === '5')) matches = true;
          else if (r.includes('participant') || r.includes('all')) matches = true;

          if (matches) {
            earnedBadges.push(prize.badgeId);
          }
        });

        // If they earned a badge, loop through every member of the team and inject it
        if (earnedBadges.length > 0) {
          for (const memberUid of team.members) {
            const userRef = doc(db, "users", memberUid);
            // using arrayUnion ensures they don't get duplicates if ran twice
            await updateDoc(userRef, {
              earnedBadges: arrayUnion(...earnedBadges)
            });
          }
        }
      }

      // Mark the contest so it can't be triggered again
      await updateDoc(doc(db, "Contests", id!), { badgesDistributed: true });
      alert("Badges distributed successfully across the arena!");
      
    } catch (error) {
      console.error("Failed to distribute badges", error);
      alert("Error distributing badges. Check console.");
    } finally {
      setActionLoading(false);
    }
  };


  if (isLoading) return <LoadingScreen message="Establishing Secure Connection..." />;
  if (isDeploying) return <LoadingScreen message="Deploying" />;
  if (!contest) return null;

  return (
    <div className='bg-gray-950 min-h-screen text-gray-200 font-mono pb-12 overflow-x-hidden'>
      {/* Top Navigation */}
      <div className="border-b border-orange-500/20 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <button onClick={() => navigate('/contests')} className="flex items-center gap-2 text-gray-400 hover:text-orange-400 transition-colors">
            <ArrowLeft size={20} /> <span className="uppercase tracking-widest text-sm font-bold">Back to Arenas</span>
          </button>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-xs font-black uppercase rounded border tracking-widest ${
              contest.status === 'Ongoing' ? 'bg-red-500/20 text-red-500 border-red-500/50 animate-pulse' : 
              contest.status === 'Upcoming' ? 'bg-amber-500/20 text-amber-500 border-amber-500/50' : 
              'bg-gray-500/20 text-gray-400 border-gray-500/50'
            }`}>
              {contest.status}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Briefing, Details & Leaderboard */}
        <div className="lg:col-span-7 space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Flame className="text-orange-500 w-8 h-8 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
              <h1 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter">
                {contest.name}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 font-bold mt-4">
              <span className="flex items-center gap-2 bg-gray-900 px-3 py-1.5 rounded-md border border-gray-800"><Clock size={16} className="text-blue-400"/> Starts: {contest.startDate?.toDate().toLocaleString()}</span>
              <span className="flex items-center gap-2 bg-gray-900 px-3 py-1.5 rounded-md border border-gray-800"><Clock size={16} className="text-red-400"/> Ends: {contest.endDate?.toDate().toLocaleString()}</span>
            </div>
          </div>

          {/* ADMIN COMMAND PANEL */}
          {isAdmin && (
            <section className="bg-red-950/20 border border-red-500/50 rounded-xl p-6 backdrop-blur-sm animate-in fade-in">
              <h2 className="text-red-400 uppercase tracking-widest font-bold flex items-center gap-2 mb-4 border-b border-red-500/20 pb-2">
                <ShieldAlert size={18} /> Admin Command Center
              </h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleStartContest}
                  disabled={contest.status === 'Ongoing' || contest.status === 'Completed'}
                  className="flex-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/50 font-black py-3 rounded-lg uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play size={18} /> Deploy Arena
                </button>
                <button 
                  onClick={handleEndContest}
                  disabled={contest.status === 'Completed'}
                  className="flex-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/50 font-black py-3 rounded-lg uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Square size={18} /> Halt Arena
                </button>
                
                {/* NEW BADGE DISTRIBUTION TRIGGER */}
                {contest.status === 'Completed' && (
                  <button
                    onClick={handleDistributeBadges}
                    disabled={contest.badgesDistributed || actionLoading}
                    className="flex-1 bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/50 font-black py-3 rounded-lg uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Award size={18} /> {contest.badgesDistributed ? 'Badges Sent' : 'Issue Badges'}
                  </button>
                )}
              </div>
            </section>
          )}

          <section className="bg-black/40 border border-orange-500/20 rounded-xl p-6 backdrop-blur-sm">
            <h2 className="text-orange-400 uppercase tracking-widest font-bold flex items-center gap-2 mb-4 border-b border-orange-500/20 pb-2">
              <Swords size={18} /> Mission Briefing
            </h2>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{contest.description || "No briefing provided. Prepare for anything."}</p>
          </section>

          <section className="bg-black/40 border border-emerald-500/20 rounded-xl p-6 backdrop-blur-sm">
            <h2 className="text-emerald-400 uppercase tracking-widest font-bold flex items-center gap-2 mb-4 border-b border-emerald-500/20 pb-2">
              <ShieldAlert size={18} /> Rules of Engagement
            </h2>
            <p className="text-emerald-100/70 text-sm whitespace-pre-wrap leading-relaxed">{contest.rules || "Survive at all costs. No other rules apply."}</p>
          </section>

          {/* LEADERBOARD / ENROLLED SQUADS SECTION */}
          <section className="bg-black/40 border border-purple-500/20 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4 border-b border-purple-500/20 pb-2">
              <h2 className="text-purple-400 uppercase tracking-widest font-bold flex items-center gap-2">
                <Trophy size={18} /> Arena Leaderboard
              </h2>
              <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-1 rounded">
                Squads: {leaderboard.length}
              </span>
            </div>
            
            {leaderboard.length === 0 ? (
              <p className="text-gray-500 italic text-sm text-center py-4">No squads have dropped in yet.</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {leaderboard.map((team, index) => (
                  <div key={team.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                    userTeam?.id === team.id 
                    ? 'bg-purple-900/30 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.1)]' 
                    : 'bg-gray-900/50 border-gray-800'
                  }`}>
                    <div className="flex items-center gap-4">
                      <span className="text-purple-500 font-black w-6">{index + 1}.</span>
                      <div>
                        <p className={`font-bold tracking-wider ${userTeam?.id === team.id ? 'text-purple-300' : 'text-gray-300'}`}>
                          {team.name} {userTeam?.id === team.id && <span className="text-xs ml-2 text-purple-400 uppercase">(You)</span>}
                        </p>
                        
                        {/* TEAM AVATARS IN LEADERBOARD */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex -space-x-2 overflow-hidden">
                            {team.members.map(memberUid => {
                              const player = playerDetails[memberUid];
                              return player ? (
                                <img 
                                  key={memberUid} 
                                  src={player.avatar} 
                                  title={player.username} 
                                  alt={player.username} 
                                  className="inline-block h-6 w-6 rounded-full ring-2 ring-gray-900 object-cover bg-gray-800" 
                                />
                              ) : (
                                <div key={memberUid} className="h-6 w-6 rounded-full ring-2 ring-gray-900 bg-gray-700 flex items-center justify-center text-[10px] text-gray-400">?</div>
                              );
                            })}
                          </div>
                          <span className="text-xs text-gray-500">{team.members.length}/4 Operatives</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-widest">Score</p>
                        <p className="text-lg font-mono font-black text-white">{team.score || 0}</p>
                      </div>
                      
                      {isAdmin && (
                        <button 
                          onClick={() => handleKickTeam(team.id, team.name)}
                          className="ml-2 p-2 bg-red-950/40 text-red-500 hover:bg-red-600 hover:text-white rounded border border-red-900/50 transition-colors"
                          title="Kick Squad"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {contest.prizes && contest.prizes.length > 0 && (
            <section className="bg-black/40 border border-amber-500/20 rounded-xl p-6 backdrop-blur-sm">
              <h2 className="text-amber-400 uppercase tracking-widest font-bold flex items-center gap-2 mb-4 border-b border-amber-500/20 pb-2">
                <Gift size={18} /> Spoils of War
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {contest.prizes.map((prize, idx) => (
                  <div key={idx} className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-lg flex flex-col justify-center items-center text-center">
                    <span className="text-amber-500 font-black text-xl mb-1">{prize.rank}</span>
                    <span className="text-amber-100/80 text-sm">{prize.reward}</span>
                    {prize.badgeId && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded mt-2 uppercase tracking-widest border border-amber-500/30">Includes Badge</span>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Registration / Squad Management */}
        <div className="lg:col-span-5">
          <div className="sticky top-28 space-y-6">
            
            {/* IF USER IS ALREADY IN A SQUAD */}
            {userTeam ? (
              <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
                <h3 className="text-2xl font-black text-cyan-400 uppercase tracking-tighter mb-1">Squad Secured</h3>
                <p className="text-cyan-200/60 text-sm mb-6">You are cleared for deployment.</p>
                
                <div className="bg-black/50 rounded-lg p-4 border border-cyan-900/50 mb-6">
                  <p className="text-xs text-cyan-500 uppercase tracking-widest mb-1">Squad Name</p>
                  <p className="text-xl text-white font-bold mb-4">{userTeam.name}</p>
                  
                  <div className="flex justify-between items-center bg-cyan-900/30 px-3 py-2 rounded">
                    <span className="text-xs text-cyan-300 uppercase">Invite Code</span>
                    <span className="font-mono text-cyan-100 tracking-widest font-bold">{userTeam.code}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-3 flex justify-between">
                    <span>Operatives ({userTeam.members.length} / 4)</span>
                  </p>
                  
                  <div className="flex flex-col gap-3">
                    {userTeam.members.map((memberUid) => {
                      const player = playerDetails[memberUid];
                      return (
                        <div key={memberUid} className="flex items-center gap-3 bg-cyan-900/20 border border-cyan-500/20 p-2 rounded-lg">
                          {player ? (
                            <>
                              <img src={player.avatar} alt={player.username} className="h-10 w-10 rounded-md object-cover border border-cyan-800" />
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-cyan-100">{player.username}</span>
                                {memberUid === userTeam.leaderId && <span className="text-[10px] text-cyan-500 uppercase tracking-widest font-bold mt-0.5">Squad Leader</span>}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="h-10 w-10 rounded-md bg-gray-800 border border-gray-700 flex items-center justify-center animate-pulse"></div>
                              <div className="h-4 w-24 bg-gray-800 rounded animate-pulse"></div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                { !completed &&
                <button 
                  onClick={handleDeployment}
                  disabled={contest.status !== 'Ongoing'}
                  className={`w-full py-4 rounded-lg font-black uppercase tracking-widest transition-all flex justify-center items-center gap-2 ${
                    contest.status === 'Ongoing' 
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] animate-pulse' 
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {contest.status === 'Ongoing' && !completed ? (
                    <><Play size={20}/> Enter Arena</>
                  ) : (
                    'Awaiting Deployment...'
                  )}
                </button>
                }

                <button
                  onClick={handleLeaveTeam}
                  disabled={actionLoading || contest.status === 'Ongoing'}
                  className="w-full mt-3 py-3 rounded-lg font-bold uppercase tracking-widest text-sm border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogOut size={16} />
                  {actionLoading ? 'Leaving...' : 'Abandon Squad'}
                </button>
              </div>
            ) : 
            
            /* IF USER IS NOT IN A SQUAD */
            (
              <div className="bg-black/60 border border-orange-500/30 rounded-xl p-6 backdrop-blur-sm relative shadow-[0_0_30px_rgba(249,115,22,0.1)]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-600"></div>
                
                {joinMode === 'idle' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Registration Open</h3>
                      <p className="text-gray-400 text-sm mt-1">Form a squad or infiltrate an existing one to enter the arena.</p>
                    </div>

                    <button 
                      onClick={() => setJoinMode('create')}
                      className="w-full bg-orange-500/10 border border-orange-500 hover:bg-orange-500 hover:text-black text-orange-400 font-bold py-4 rounded-lg transition-all uppercase tracking-widest flex items-center justify-center gap-3 group"
                    >
                      <Users className="group-hover:animate-bounce" size={20} /> Form New Squad
                    </button>
                    
                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-gray-800"></div>
                      <span className="flex-shrink mx-4 text-gray-600 text-xs font-bold tracking-widest uppercase">OR</span>
                      <div className="flex-grow border-t border-gray-800"></div>
                    </div>

                    <button 
                      onClick={() => setJoinMode('join')}
                      className="w-full bg-red-900/20 border border-red-500/50 hover:bg-red-500 hover:text-black text-red-400 font-bold py-4 rounded-lg transition-all uppercase tracking-widest flex items-center justify-center gap-3"
                    >
                      <Key size={20} /> Use Invite Code
                    </button>
                  </div>
                )}

                {joinMode === 'create' && (
                  <form onSubmit={handleCreateTeam} className="animate-in slide-in-from-right-4 duration-300">
                    <button type="button" onClick={() => setJoinMode('idle')} className="text-gray-500 hover:text-white mb-4 flex items-center gap-1 text-sm"><ArrowLeft size={14}/> Back</button>
                    <h3 className="text-xl font-black text-orange-400 uppercase tracking-tighter mb-4">Name Your Squad</h3>
                    <input 
                      type="text" 
                      required
                      maxLength={20}
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="e.g. Cyber Ninjas" 
                      className="w-full bg-gray-900 border border-gray-700 p-4 rounded-lg outline-none focus:border-orange-500 text-white font-bold tracking-wider mb-6 placeholder-gray-600"
                    />
                    <button disabled={actionLoading} type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-lg uppercase tracking-widest transition-all flex justify-center items-center">
                      {actionLoading ? 'Initializing...' : 'Confirm Registration'}
                    </button>
                  </form>
                )}

                {joinMode === 'join' && (
                  <form onSubmit={handleJoinTeam} className="animate-in slide-in-from-left-4 duration-300">
                    <button type="button" onClick={() => setJoinMode('idle')} className="text-gray-500 hover:text-white mb-4 flex items-center gap-1 text-sm"><ArrowLeft size={14}/> Back</button>
                    <h3 className="text-xl font-black text-red-400 uppercase tracking-tighter mb-4">Enter Invite Code</h3>
                    <input 
                      type="text" 
                      required
                      value={teamCode}
                      onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                      placeholder="6-CHAR CODE" 
                      className="w-full bg-gray-900 border border-gray-700 p-4 rounded-lg outline-none focus:border-red-500 text-white font-mono text-center text-xl tracking-[0.5em] mb-6 placeholder-gray-700 uppercase"
                    />
                    <button disabled={actionLoading} type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-lg uppercase tracking-widest transition-all flex justify-center items-center">
                      {actionLoading ? 'Verifying...' : 'Infiltrate Squad'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contest;