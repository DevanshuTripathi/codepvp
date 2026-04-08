import { db } from "../../firebaseConfig";
import { getDoc, doc, updateDoc, collection, query, where, getDocs, arrayUnion, serverTimestamp } from "firebase/firestore";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { socket } from "../utils/socket";
import { useMatchTimer } from '../hooks/useMatchTimer';
import type { gameRes } from "./GameFinishPage";
import { useUser } from "../hooks/useUser";
import ChatBox from "./components/chat-box";
import Matching from "./components/Matching";
import LoadingScreen from "./components/LoadingScreen";

// --- UNIFIED SCORING LOGIC ---
export const markTeamSolved = async (teamId: string, problemId: string, roomId: string, currentUserName: string) => {
  // 1. Check if it's an FFA Contest
  const contestRef = doc(db, "Contests", roomId);
  const contestSnap = await getDoc(contestRef);

  if (contestSnap.exists()) {
    // --- FFA MODE SCORING ---
    const teamRef = doc(db, "Teams", teamId);
    const teamSnap = await getDoc(teamRef);
    if (!teamSnap.exists()) return;

    const teamData = teamSnap.data();
    const solvedProblems = teamData.solvedProblems || [];

    if (solvedProblems.includes(problemId)) return; // Already solved

    // Fetch problem difficulty to assign points
    const probRef = doc(db, "ProblemsWithHTC", problemId);
    const probSnap = await getDoc(probRef);
    const difficulty = probSnap.data()?.difficulty || 'Medium';
    const points = difficulty === 'Easy' ? 10 : difficulty === 'Medium' ? 20 : 30;

    await updateDoc(teamRef, {
      solvedProblems: arrayUnion(problemId), // Store ID instead of title for FFA robustness
      score: (teamData.score || 0) + points
    });
    return;
  }

  // 2. --- LEGACY 1V1 SCORING ---
  const docRef = doc(db, "RoomSet", roomId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return;
  const data = docSnap.data();

  const problemArray = data?.allProblems || [];
  const problem = problemArray.find((p: any) => p.id === problemId);
  const teamKey = teamId === "A" ? "teamA" : "teamB";

  const solvedProblems = data?.[teamKey]?.solvedProblems || [];
  if (solvedProblems.includes(problem.title)) return;
  else solvedProblems.push(problem.title);

  const currScore = data?.[teamKey].score;
  const difficulty: string = problem.difficulty;
  let points = difficulty === 'Easy' ? 10 : difficulty === 'Medium' ? 20 : 30;

  await updateDoc(docRef, {
    [`${teamKey}.solvedProblems`]: solvedProblems,
    [`${teamKey}.score`]: currScore + points
  });

  const players = docSnap.data()?.[teamKey].players || [];
  const playerIndex = players.findIndex((p: any) => p.pid === currentUserName);

  if (playerIndex !== -1) {
    const updatedPlayers = [...data?.[teamKey].players];
    updatedPlayers[playerIndex] = {
      ...updatedPlayers[playerIndex],
      points: updatedPlayers[playerIndex].points + points,
      problemsSolved: updatedPlayers[playerIndex].problemsSolved + 1,
    };
    await updateDoc(docRef, { [`${teamKey}.players`]: updatedPlayers });
  }
}

const StatusIcon: React.FC<{ solved: boolean }> = ({ solved }) => {
  if (solved) {
    return (
      <div className="flex items-center gap-2 text-green-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        <span>Solved</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-gray-500">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>
      <span>Pending</span>
    </div>
  );
};

export default function Problemset() {
  const [data, setData] = useState<gameRes | null>(null);

  const [isFFA, setIsFFA] = useState(false); // Mode Tracker
  const [ffaSolved, setFfaSolved] = useState<string[]>([]); // Track local team solves for FFA

  const [teamAFinished, setTeamAFinished] = useState(false);
  const [teamBFinished, setTeamBFinished] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { teamId, roomId } = useParams();
  const navigate = useNavigate();
  const { timeLeft, isMatchOver } = useMatchTimer(roomId);
  const { user, loading } = useUser();

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showMatching, setShowMatching] = useState(() => {
    // Check if they've already seen it for this specific room
    return sessionStorage.getItem(`has_seen_matching_${roomId}`) !== 'true';
    });
  const [myTeamData, setMyTeamData] = useState<any[]>([]);
  const [opponentsData, setOpponentsData] = useState<any[]>([]);

  useEffect(() => {
    if(!user && !loading) navigate("/login");
  })

  // After match is Over navigate to results page
  useEffect(() => {
      if (isMatchOver) {
          console.log("Match ended. Auto-submitting code...");
          navigate(`/room/${roomId}/results`);
      }
  }, [isMatchOver, roomId, navigate]);

  useEffect(() => {
    if (!roomId || !teamId) return;
    
    const fetchData = async () => {
      // 1. Try fetching legacy RoomSet (1v1)
      const roomRef = doc(db, "RoomSet", roomId!);
      const roomSnap = await getDoc(roomRef);

      if (roomSnap.exists()) {
        setIsFFA(false);
        const roomData = roomSnap.data() as gameRes;
        setData(roomData);

        const myTeamKey = teamId === "A" ? "teamA" : "teamB";
        const oppTeamKey = teamId === "A" ? "teamB" : "teamA";
        
        // ... (Keep existing fetchRatingsForTeam logic for 1v1 here to populate myTeamData/opponentsData)
        setMyTeamData(roomData[myTeamKey]?.players || []);
        setOpponentsData(roomData[oppTeamKey]?.players || []);
        setIsLoadingData(false);

      } else {
        // 2. Fallback to Contests Collection (FFA Mode)
        const contestRef = doc(db, "Contests", roomId);
        const contestSnap = await getDoc(contestRef);

        if (contestSnap.exists()) {
          setIsFFA(true);
          setShowMatching(false); // Skip matching screen for FFA 
          const contestData = contestSnap.data();

          // Fetch Problems
          const pIds = contestData.problemIds || [];
          const probPromises = pIds.map((id: string) => getDoc(doc(db, "ProblemsWithHTC", id)));
          const probDocs = await Promise.all(probPromises);
          const loadedProblems = probDocs.map(d => ({ id: d.id, ...d.data() }));

          // Construct a mock 'data' object so the UI maps over it cleanly
          setData({ allProblems: loadedProblems } as any);

          // Fetch FFA Teams
          const teamsQuery = query(collection(db, "Teams"), where("contestId", "==", roomId));
          const teamsSnap = await getDocs(teamsQuery);
          
          let myFfaTeam: any = null;
          const otherTeams: any[] = [];

          teamsSnap.forEach(doc => {
            if (doc.id === teamId) {
              myFfaTeam = { id: doc.id, ...doc.data() };
            } else {
              otherTeams.push({ id: doc.id, ...doc.data() });
            }
          });

          if (myFfaTeam) setFfaSolved(myFfaTeam.solvedProblems || []);
          
          // Show top 3 other teams as "Opponents"
          otherTeams.sort((a, b) => (b.score || 0) - (a.score || 0));
          setOpponentsData(otherTeams.slice(0, 3).map(t => ({ pid: t.name, rating: `Score: ${t.score || 0}` })));
          
          setIsLoadingData(false);
        } else {
          navigate("/404");
        }
      }
    };

    fetchData();
  }, [roomId, teamId, navigate, user]);

  useEffect(() => {
    socket.emit("joinProblemset", { roomId, teamId });
  }, [roomId, teamId]);

  useEffect(() => {
    const handleSolvedProblem = ({  problemId, teamId: eventTeamId, username }: any) => {
      markTeamSolved(eventTeamId, problemId, roomId!, username);
      if (isFFA && eventTeamId === teamId) {
        setFfaSolved(prev => [...prev, problemId]);
      }
    };
    
    const handleTeamFinished = ({ teamId }: { teamId: string }) => {
      if (teamId === 'A') {
        setTeamAFinished(true);
      } else if (teamId === 'B') {
        setTeamBFinished(true);
      }
    };

    socket.on("solvedProblem", handleSolvedProblem);
    socket.on("teamFinishedUpdate", handleTeamFinished);

    return () => {
      socket.off("solvedProblem", handleSolvedProblem);
      socket.off("teamFinishedUpdate", handleTeamFinished);
    };
  }, [roomId, data, isFFA]);

  const allProblemsSolved = useMemo(() => {
    if (!data || !data.allProblems || !teamId) return false;

    if (isFFA) {
      return data.allProblems.every((p: any) => (ffaSolved || []).includes(p.id));
    } else {
      // Safely extract the team data for 1v1 mode
      const teamData = teamId === "A" ? data?.teamA : data?.teamB;
      const solvedArray = teamData?.solvedProblems || [];
      const solvedSet = new Set(solvedArray);
      
      return data.allProblems.every((problem: any) => solvedSet.has(problem.title));
    }
  }, [data, teamId, ffaSolved, isFFA]);


  const handleFinishGame = async () => {
    if (isFFA && teamId) {
      if (!window.confirm("Are you sure you want to extract? You won't be able to solve more problems, but your completion time will be locked in for tie-breakers.")) return;
      
      const teamRef = doc(db, "Teams", teamId);
      await updateDoc(teamRef, {
        finishedAt: serverTimestamp() // Locks in their final time
      });
      
      navigate(`/room/${roomId}/results`);
      return;
    }

    if (allProblemsSolved) {
      socket.emit("finishGame", { roomId, teamId });
    }
  };

  const currentUserTeamFinished = teamId === 'A' ? teamAFinished : teamBFinished;


  if (isLoadingData) {
    return <LoadingScreen message="Loading Arena" />; 
  }

  if (showMatching && !isFFA) {
    return (
      <Matching 
        teamA={myTeamData} 
        teamB={opponentsData} 
        onComplete={() => {
          setShowMatching(false);
          // Mark as seen so it doesn't show again when navigating back!
          sessionStorage.setItem(`has_seen_matching_${roomId}`, 'true');
        }} 
      />
    );
  }

  return (
    <div className="flex justify-center items-center bg-gray-900 h-dvh w-dvw">
      <div
        className="z-10 flex flex-col p-8 max-w-4xl w-full
      bg-black/30 backdrop-blur-md 
      border border-cyan-400/20 rounded-xl
      shadow-2xl shadow-cyan-500/10"
      >
        {/* Header */}
        <div className="w-full flex justify-between items-start mb-8">
          <div className="flex flex-col gap-3">
            <h2 className="text-4xl font-bold text-cyan-300" style={{ textShadow: `0 0 8px #0ff` }}>
              {isFFA ? "FFA Drop Zone" : "Problem Set"}
            </h2>
            
            {/* Opponents Display */}
            {opponentsData.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-sm uppercase tracking-wider font-semibold">VS:</span>
                <div className="flex gap-2">
                  {opponentsData.map((opp: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-800/80 px-3 py-1.5 rounded-md border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.1)]">
                      <span className="text-purple-300 font-medium">{opp.pid}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="text-right">
            <p className="text-purple-300 text-lg">Time Remaining</p>
            <p className="text-white text-3xl font-bold font-mono">
              {timeLeft}
            </p>
          </div>
        </div>

        {/* Problem List */}
        <div className="w-full flex flex-col gap-4 overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar">
          {data?.allProblems?.map((problem: any, index: number) => {
            
            // Bulletproof check for both modes
            let isSolved = false;
            if (isFFA) {
              isSolved = (ffaSolved || []).includes(problem.id);
            } else {
              const teamData = teamId === "A" ? data?.teamA : data?.teamB;
              isSolved = teamData?.solvedProblems?.includes(problem.title) || false;
            }

            return (
              <div key={index} className="flex justify-between items-center p-4 bg-gray-900/40 border border-gray-700/50 rounded-lg hover:bg-gray-800/60 hover:border-cyan-400/50 transition-all">
                <div className="flex items-center gap-4">
                  <span className="text-2xl text-gray-600 font-bold">0{index + 1}</span>
                  <h3 className="text-xl md:text-2xl text-white">{problem.title}</h3>
                </div>
                <div className="flex items-center gap-6">
                  <StatusIcon solved={isSolved} />
                  <button
                    onClick={() => navigate(`/room/${roomId}/problems/${problem.id}/team/${teamId}`)}
                    className="font-bold text-cyan-300 border-2 border-cyan-400/50 rounded-lg px-5 py-2 transition-all hover:bg-cyan-300 hover:text-gray-900"
                  >
                    View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-8 flex flex-col items-center justify-center text-center">
          {(allProblemsSolved || isFFA) && !currentUserTeamFinished && (
            <button
              onClick={handleFinishGame}
              className="font-bold text-gray-900 bg-green-400 border-2 border-green-400 rounded-lg px-8 py-3 text-xl
                         transition-all duration-300 transform hover:scale-105
                         hover:bg-transparent hover:text-green-300
                         hover:shadow-[0_0_20px_rgba(74,222,128,0.5)]"
            >
              {isFFA ? "Extract Squad (Finish Early)" : "Finish Game"}
            </button>
          )}

          {currentUserTeamFinished && (
            <p className="text-2xl font-bold text-green-400">
              You have finished! Waiting for the match to end...
            </p>
          )}

          {((teamId === 'A' && teamBFinished) || (teamId === 'B' && teamAFinished)) && (
            <p className="mt-4 text-purple-300">
              The other team has also finished.
            </p>
          )}
        </div>
      </div>
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 w-21 h-21 rounded-full 
          bg-gray-900/80 backdrop-blur-sm border border-cyan-500/30
          hover:border-cyan-400 transition-all duration-300
          shadow-lg hover:shadow-cyan-500/25
          group z-[60]"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-full 
          opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/30 to-purple-500 rounded-full opacity-0 
          group-hover:opacity-30 animate-pulse blur-md" />
        <img 
          src="/chat.png" 
          alt="Chat" 
          className="w-15 h-15 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
            group-hover:scale-110 transition-transform duration-300"
        />
      </button>

    
      {isChatOpen && (
        <div className="fixed bottom-20 right-6 w-96 h-[36rem] z-[60]">
          <ChatBox onClose={() => setIsChatOpen(false)} />
        </div>
      )}
    
    </div>
  );
}
