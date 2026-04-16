import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDoc, doc, updateDoc, arrayUnion, increment, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useUser } from '../hooks/useUser';
import type { ProblemData } from './Problem';
import { updateUserRating } from '../utils/updateUserStats';
import { Clock, Target, ShieldAlert } from 'lucide-react';
import LoadingScreen from './components/LoadingScreen';

export interface gameRes {
  tournamentId?: string;
  matchId?: string;
  winningTeam: string;
  teamA: {
    name: string;
    score: number;
    players: {
      pid: string;
      problemsSolved: number;
      points: number;
    }[];
    solvedProblems: string[];
  };
  teamB: {
    name: string;
    score: number;
    players: {
      pid: string;
      problemsSolved: number;
      points: number;
    }[];
    solvedProblems: string[];
  };
  allProblems: ProblemData[];
}

interface MyFFAStats {
  name: string;
  score: number;
  solvedCount: number;
  timeTakenStr: string;
}

const ResultBanner: React.FC<{ didWin: boolean; isDraw: boolean; ratingChange: number | null; isFFA?: boolean }> = ({ didWin, isDraw, ratingChange, isFFA }) => {
  return (
    <div className="text-center mb-6 animate-in zoom-in duration-500">
      {isFFA ? (
        <>
          <h1 className="text-5xl md:text-6xl font-black mb-2 text-cyan-400" style={{ textShadow: '0 0 15px #22d3ee, 0 0 20px #22d3ee' }}>
            ARENA CLOSED
          </h1>
          <p className="text-lg text-cyan-200/70 mt-2">Your squad has been extracted.</p>
        </>
      ) : (
        <>
          {isDraw ? (
            <h1 className="text-6xl font-bold text-yellow-400 mb-2" style={{ textShadow: '0 0 15px #fbbf24, 0 0 20px #fbbf24' }}>
              DRAW
            </h1>
          ) : didWin ? (
            <h1 className="text-6xl font-bold text-green-400 mb-2" style={{ textShadow: '0 0 15px #2f0, 0 0 20px #2f0' }}>
              VICTORY
            </h1>
          ) : (
            <h1 className="text-6xl font-bold text-red-500 mb-2" style={{ textShadow: '0 0 15px #f22, 0 0 20px #f22' }}>
              DEFEAT
            </h1>
          )}
          
          {ratingChange !== null && (
            <div className={`text-2xl font-mono font-bold mt-2 animate-bounce ${
              ratingChange > 0 ? 'text-green-400' : ratingChange < 0 ? 'text-red-400' : 'text-gray-400'
            }`}>
              {ratingChange > 0 ? `+${ratingChange}` : ratingChange} Rating
            </div>
          )}
          <p className="text-lg text-gray-400 mt-2">The match has concluded.</p>
        </>
      )}
    </div>
  );
};

interface TeamCardProps {
  teamData: gameRes["teamA"] | gameRes["teamB"];
  allProblems: string[];
}

const TeamCard: React.FC<TeamCardProps> = ({ teamData, allProblems }) => {
  const teamColor = teamData.name === 'Team A' ? 'cyan' : 'purple';

  return (
    <div className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-4">
      <h3 className={`text-2xl font-bold text-${teamColor}-400 mb-3 text-center`}>{teamData.name}</h3>
      <div className="mb-4 text-center">
        <p className="text-4xl font-bold text-white">{teamData.score}</p>
        <p className="text-gray-400">Total Points</p>
      </div>
      
      <div className="mb-4">
        {teamData.players.map(player => (
          <div key={player.pid} className="flex justify-between items-center bg-gray-800/50 p-2 rounded mb-2">
            <span className="text-sm truncate text-gray-300 w-2/5">{player.pid}</span>
            <div className="text-right">
              <p className="font-bold text-white">{player.points} pts</p>
            </div>
          </div>
        ))}
      </div>
      
      <div>
        <h4 className="text-lg font-semibold text-gray-300 mb-2 text-center border-t border-gray-700 pt-3">Problems Solved</h4>
        <ul className="space-y-1">
          {allProblems.map(problem => {
            const solved = teamData.solvedProblems.includes(problem);
            return (
              <li key={problem} className={`flex items-center gap-2 ${solved ? 'text-green-400' : 'text-gray-600'}`}>
                {solved ? 
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> :
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                }
                <span>{problem}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

const GameFinishPage: React.FC = () => {
  const [gameData, setGameData] = useState<gameRes | null>(null);
  const [myTeam, setMyTeam] = useState<string | null>(null);
  const [ratingChange, setRatingChange] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // FFA Specific States
  const [isFFA, setIsFFA] = useState(false);
  const [myFfaStats, setMyFfaStats] = useState<MyFFAStats | null>(null);

  const { roomId } = useParams();
  const { user } = useUser();
  const navigate = useNavigate();
  const hasProcessedTournament = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!roomId || !user) return;

      const docRef = doc(db, "RoomSet", roomId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        // --- 1V1 LEGACY LOGIC ---
        setIsFFA(false);
        const data = docSnap.data() as gameRes;
        const currentUserName = user.displayName || user.email || "Anon";
        
        const winningTeam = data.teamA.score > data.teamB.score ? "Team A" : data.teamB.score > data.teamA.score ? "Team B" : "Draw";
        setGameData({ ...data, winningTeam });

        const inTeamA = data?.teamA.players.some((p) => p.pid === currentUserName);
        const inTeamB = data?.teamB.players.some((p) => p.pid === currentUserName);

        let userPoints = 0;
        let winningBonus = 0;

        if (inTeamA) {
          setMyTeam("Team A");
          const userPlayer = data.teamA.players.find(p => p.pid === currentUserName);
          userPoints = userPlayer?.points ?? 0;
          winningBonus = (data.teamA.score === data.teamB.score) ? 0 : (data.teamA.score > data.teamB.score) ? 50 : -50;
        } else if (inTeamB) {
          setMyTeam("Team B");
          const userPlayer = data.teamB.players.find(p => p.pid === currentUserName);
          userPoints = userPlayer?.points ?? 0;
          winningBonus = (data.teamB.score === data.teamA.score) ? 0 : (data.teamB.score > data.teamA.score) ? 50 : -50;
        }

        // Apply rating changes if the user was actually in the game
        if (inTeamA || inTeamB) {
          const totalChange = userPoints + winningBonus;
          setRatingChange(totalChange);
          updateUserRating(user.uid, totalChange);
        }

        // Tournament Knockout Logic
        if (data.tournamentId && data.matchId && !hasProcessedTournament.current) {
          hasProcessedTournament.current = true;

          try {
            const matchRef = doc(db, `Tournaments/${data.tournamentId}/Matches`, data.matchId);
            const matchSnap = await getDoc(matchRef);

            if (matchSnap.exists() && matchSnap.data().status !== 'completed') {
              const matchData = matchSnap.data();
              let winnerUid: string | null = null;
              let loserUid: string | null = null;

              if (winningTeam === "Team A") {
                winnerUid = matchData.p1.uid;
                loserUid = matchData.p2?.uid || null;
              } else if (winningTeam === "Team B") {
                winnerUid = matchData.p2?.uid || null;
                loserUid = matchData.p1.uid;
              }

              await updateDoc(matchRef, {
                status: 'completed',
                winner: winnerUid,
                loser: loserUid
              });

              const tourneyRef = doc(db, "Tournaments", data.tournamentId);
              const updates: any = {};

              if (loserUid) updates.eliminated = arrayUnion(loserUid);
              
              if (winnerUid) {
                const pointsEarned = winningTeam === "Team A" ? data.teamA.score : data.teamB.score;
                updates[`scores.${winnerUid}`] = increment(pointsEarned);
              }

              if (Object.keys(updates).length > 0) {
                await updateDoc(tourneyRef, updates);
              }
            }
          } catch (err) {
            console.error("Error updating tournament status:", err);
          }
        }
      } 
      else {
        // --- FFA PERSONAL STATS LOGIC ---
        const contestRef = doc(db, "Contests", roomId);
        const contestSnap = await getDoc(contestRef);
        
        if (contestSnap.exists()) {
          setIsFFA(true);
          const contestData = contestSnap.data();
          
          const teamsQuery = query(collection(db, "Teams"), where("contestId", "==", roomId), where("members", "array-contains", user.uid));
          const teamsSnap = await getDocs(teamsQuery);
          
          if (!teamsSnap.empty) {
            const teamData = teamsSnap.docs[0].data();

            let timeString = "Time Expired / Survived";
            if (teamData.finishedAt && contestData.startDate) {
              const diffMs = teamData.finishedAt.toMillis() - contestData.startDate.toMillis();
              const diffMins = Math.floor(diffMs / 60000);
              const diffSecs = Math.floor((diffMs % 60000) / 1000);
              timeString = `${diffMins}m ${diffSecs}s`;
            }

            setMyFfaStats({
              name: teamData.name,
              score: teamData.score || 0,
              solvedCount: teamData.solvedProblems?.length || 0,
              timeTakenStr: timeString
            });
          }
        }
      }
      setIsLoading(false);
    };

    fetchData();
  }, [roomId, user]);

  if (isLoading) return <LoadingScreen message="Loading Results" />

  return (
    <div className='flex h-dvh justify-center items-center bg-gray-950 overflow-hidden py-10' >
      <div className="z-10 flex flex-col p-8 max-w-4xl w-full bg-black/40 backdrop-blur-md border border-cyan-400/20 rounded-xl shadow-2xl shadow-cyan-500/10">
        
        <ResultBanner didWin={gameData?.winningTeam === myTeam} isDraw={gameData?.winningTeam === "Draw"} ratingChange={ratingChange} isFFA={isFFA} />

        {isFFA ? (
          // --- FFA PERSONAL SQUAD STATS VIEW ---
          myFfaStats ? (
            <div className="w-full max-w-lg mx-auto mb-8 bg-cyan-950/20 rounded-xl border border-cyan-500/30 p-8 shadow-[0_0_30px_rgba(6,182,212,0.1)] text-center animate-in slide-in-from-bottom-4">
              <ShieldAlert className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
              <h2 className="text-sm font-black text-cyan-500 uppercase tracking-widest mb-1">Squad Intel</h2>
              <h3 className="text-3xl font-bold text-white mb-8">{myFfaStats.name}</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/50 p-4 rounded-lg border border-cyan-900/50">
                  <Target className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <p className="text-3xl font-black text-white font-mono">{myFfaStats.score}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Total Points</p>
                </div>
                <div className="bg-black/50 p-4 rounded-lg border border-cyan-900/50">
                  <Clock className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                  <p className="text-xl font-black text-white font-mono mt-1">{myFfaStats.timeTakenStr}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mt-2">Combat Time</p>
                </div>
              </div>
              
              <div className="mt-4 bg-black/50 p-3 rounded-lg border border-cyan-900/50">
                <p className="text-cyan-300 font-bold">{myFfaStats.solvedCount} <span className="text-gray-400 font-normal">Targets Neutralized</span></p>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 my-8">Extracting squad data...</div>
          )
        ) : (
          // --- LEGACY 1V1 VIEW ---
          gameData && (
             <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <TeamCard teamData={gameData.teamA} allProblems={gameData.allProblems.map(problem => problem.title)} />
              <TeamCard teamData={gameData.teamB} allProblems={gameData.allProblems.map(problem => problem.title)} />
             </div>
          )
        )}

        <div className="flex gap-4 max-w-sm mx-auto w-full shrink-0 mt-4">
          {gameData?.tournamentId ? (
            <button onClick={() => navigate(`/tournaments/${gameData.tournamentId}`)} className="w-full font-bold text-gray-900 bg-amber-400 rounded-lg py-3 text-xl transition-all hover:bg-amber-300">Return to Tournament</button>
          ) : isFFA ? (
            <button onClick={() => navigate(`/contests/${roomId}`)} className="w-full font-black tracking-widest uppercase text-gray-900 bg-cyan-400 rounded-lg py-4 text-lg transition-all hover:bg-cyan-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]">
              View Leaderboard
            </button>
          ) : (
            <button onClick={() => navigate('/')} className="w-full font-bold text-gray-900 bg-cyan-300 rounded-lg py-3 text-xl transition-all hover:bg-cyan-200">Return to Main Menu</button>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default GameFinishPage;